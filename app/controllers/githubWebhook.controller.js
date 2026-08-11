const crypto = require("crypto");
const db = require("../models");
const { decrypt } = require("../authentication/crypto");
const { logTicketChanged} = require("../services/ticketHistoryService");

const {
  AutomationEvents,
  findStatusWithEvent,
} = require("../services/boardStatusAutomation");
const { LogActions } = require("../config/userActivityLogActions");

const Repo = db.githubRepository;
const Ticket = db.ticket;
const UserActivityLog = db.userActivityLog;

// GitHub sends the action; we care about two of them.
const ACTION_EVENTS = {
  opened: AutomationEvents.PR_OPENED,
  reopened: AutomationEvents.PR_OPENED,
};

const LOG_ACTIONS = {
  [AutomationEvents.PR_OPENED]: LogActions.GITHUB_PR_OPENED,
  [AutomationEvents.PR_MERGED]: LogActions.GITHUB_PR_MERGED,
};

/**
 * Constant-time string compare. crypto.timingSafeEqual throws when the buffers
 * differ in length, so the length check has to come first.
 */
const timingSafeEqualStr = (a, b) => {
  const ba = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

const signatureMatches = (rawBody, secret, header) =>
  timingSafeEqualStr(
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    header
  );

/**
 * Works out which automation event a pull_request payload represents, or null
 * for the ones we ignore (synchronize, labeled, closed-without-merge, ...).
 */
const eventForPayload = (payload) => {
  const action = payload && payload.action;
  if (action === "closed") {
    return payload.pull_request && payload.pull_request.merged === true
      ? AutomationEvents.PR_MERGED
      : null;
  }
  return ACTION_EVENTS[action] || null;
};

/**
 * Receives GitHub webhook deliveries. Unauthenticated by design — GitHub cannot
 * present a bearer token, so the X-Hub-Signature-256 HMAC is the authentication.
 *
 * Anything we do not act on returns 2xx quickly, so GitHub's delivery log stays
 * green for events that simply are not interesting.
 */
exports.handle = async (req, res) => {
  const delivery = req.get("x-github-delivery");

  try {
    if (!req.rawBody) {
      return res.status(400).send({
        message:
          "Raw body unavailable. Configure the GitHub webhook with content type application/json.",
      });
    }

    // The payload is not trusted yet. It is read here only to work out WHICH
    // repository's secret to verify against — naming a different repo cannot
    // forge a valid signature, so selecting the key this way is safe.
    const fullName = req.body && req.body.repository && req.body.repository.full_name;
    if (typeof fullName !== "string" || !fullName.includes("/")) {
      return res.status(202).send({ message: "No repository on this event." });
    }

    const [owner, repoSlug] = fullName.split("/");
    // Matched on the derived pair, never on `name` — that is a display label a
    // user can rename freely.
    //
    // MySQL's default collation is case-insensitive, so Acme/Widgets matches
    // acme/widgets. A _bin or _cs collation would need LOWER() on both sides.
    const repo = await Repo.scope("withWebhookSecret").findOne({
      where: { owner: owner, repoSlug: repoSlug },
    });
    if (!repo) {
      return res.status(202).send({ message: "Repository is not linked to a project." });
    }

    if (!repo.webhookSecret) {
      return res.status(401).send({
        message: "No webhook secret configured for this repository.",
      });
    }

    let secret;
    try {
      secret = await decrypt(repo.webhookSecret);
    } catch {
      // Most likely SECRET_KEY was rotated since the secret was stored.
      console.error(`Webhook secret for repo ${repo.id} could not be decrypted.`, delivery);
      return res.status(500).send({ message: "Webhook secret could not be read." });
    }

    if (!signatureMatches(req.rawBody, secret, req.get("x-hub-signature-256"))) {
      return res.status(401).send({ message: "Invalid signature." });
    }

    // Verified from here on.
    const eventName = req.get("x-github-event");

    if (eventName === "ping") {
      return res.send({ message: "pong" });
    }

    if (eventName !== "pull_request") {
      return res.status(202).send({ message: "Event ignored." });
    }

    const event = eventForPayload(req.body);
    if (!event) {
      return res.status(202).send({ message: "Action ignored." });
    }

    const pull = req.body.pull_request || {};
    const headRef = pull.head && pull.head.ref;
    if (!headRef) {
      return res.status(202).send({ message: "No head branch on this pull request." });
    }

    // Scoping by project is what stops a branch name in one project matching a
    // ticket in another.
    const tickets = await Ticket.findAll({
      where: { projectId: repo.projectId, githubBranchName: headRef },
    });

    if (tickets.length === 0) {
      return res.status(202).send({ message: "No ticket matches this branch." });
    }
    if (tickets.length > 1) {
      // Generated branch names do not carry the ticket id, so two tickets can
      // share one. Refuse rather than move the wrong card.
      console.log(
        `Webhook ${delivery}: ${tickets.length} tickets share branch "${headRef}" in project ${repo.projectId}.`
      );
      return res.status(202).send({
        message: "More than one ticket matches this branch.",
        reason: "AMBIGUOUS_TICKET",
      });
    }

    const ticket = tickets[0];

    const status = await findStatusWithEvent(repo.projectId, event);
    if (!status) {
      return res.status(202).send({
        message: "No board status is configured for this event.",
      });
    }

    const updateData = { statusId: status.id };
    if (pull.html_url) updateData.githubPrURL = pull.html_url;
    if (ticket.repoId == null) updateData.repoId = repo.id;
    const before = Ticket.findByPk(ticket.id);
    await Ticket.update(updateData, { where: { id: ticket.id } });
    const after = Ticket.findByPk(ticket.id);
    // Log the action to the user activity log. userId is nullable, which is
    // what lets a system-driven event be recorded with no acting user.
    try {
      await UserActivityLog.create({
        userId: null,
        action: LOG_ACTIONS[event],
        detail: ` moved ticket "${ticket.title}" to "${status.name}" (PR #${pull.number})`,
        ipAddress: req.ip,
        userAgent: req.headers?.["user-agent"],
      });
      await logTicketChanged(before, after, null);
    } catch (error) {
      console.log(`Error writing ${LOG_ACTIONS[event]} action to User Activity Log: `, error);
    }

    res.send({
      message: "Ticket updated.",
      ticketId: ticket.id,
      statusId: status.id,
    });
  } catch (err) {
    // A 500 shows red in GitHub's Recent Deliveries and can be redelivered by
    // hand, so do not mask real failures as 2xx.
    console.error(`Webhook ${delivery} failed:`, err);
    res.status(500).send({ message: "Webhook processing failed." });
  }
};
