// Orchestrates what happens when a ticket lands in a board status that carries
// a GitHub automation event. Keeps the controller thin.
//
// The single entry point never throws and never touches `res` — a GitHub
// outage must not stop somebody from moving a card.

const db = require("../models");
const { decrypt } = require("../authentication/crypto");
const github = require("./github.service");
const { parseRepoUrl } = require("./githubUrl");
const { buildBranchName } = require("./githubBranchName");
const { AutomationEvents, getStatusEvent } = require("./boardStatusAutomation");
const { LogActions } = require("../config/userActivityLogActions");

const Ticket = db.ticket;
const BoardStatus = db.boardStatus;
const Repo = db.githubRepository;
const User = db.user;
const UserActivityLog = db.userActivityLog;

const skip = (reason) => ({ ran: false, reason: reason });

/**
 * Picks the repository a ticket's branch should be created on.
 * @return {Promise<{repo: object} | {reason: string}>}
 */
const resolveRepositoryForTicket = async (ticket) => {
  if (ticket.repoId != null) {
    const repo = await Repo.findByPk(ticket.repoId);
    if (!repo) return { reason: "NO_REPO_LINKED" };
    // repoId is client-settable through the generic ticket update, so confirm
    // it actually belongs to this ticket's project before using anyone's token
    // against it.
    if (String(repo.projectId) !== String(ticket.projectId)) {
      return { reason: "REPO_PROJECT_MISMATCH" };
    }
    return { repo: repo };
  }

  const repos = await Repo.findAll({ where: { projectId: ticket.projectId } });
  if (!repos || repos.length === 0) return { reason: "NO_REPO_LINKED" };
  if (repos.length > 1) return { reason: "AMBIGUOUS_REPO" };
  return { repo: repos[0] };
};

/**
 * Reads and decrypts the acting user's GitHub token.
 *
 * Always the acting user's — never the assignee's or the project creator's.
 * Using somebody else's credentials would attribute a branch to a person who
 * did not act.
 * @return {Promise<{token: string} | {reason: string}>}
 */
const resolveTokenForUser = async (userId) => {
  if (userId == null) return { reason: "NO_TOKEN" };

  const user = await User.scope("withGithubToken").findByPk(userId);
  if (!user || !user.githubToken) return { reason: "NO_TOKEN" };

  try {
    const token = await decrypt(user.githubToken);
    if (typeof token !== "string" || token === "") return { reason: "TOKEN_UNREADABLE" };
    return { token: token };
  } catch {
    // Most likely SECRET_KEY was rotated since the token was stored.
    return { reason: "TOKEN_UNREADABLE" };
  }
};

/**
 * Runs any GitHub automation attached to the board status a ticket just moved
 * into. Returns a plain result object; callers report it, they never branch on
 * an exception.
 *
 * @return {Promise<object>} { ran: false, reason } when nothing was configured,
 *   otherwise { ran: true, ok, ... }.
 */
const runStatusChangeAutomation = async ({ ticketId, newStatusId, actingUserId, req }) => {
  try {
    // Cheapest check first — this short-circuits essentially every ordinary
    // ticket edit after a single lookup.
    const status = await BoardStatus.findByPk(newStatusId);
    if (getStatusEvent(status) !== AutomationEvents.CREATE_BRANCH) {
      return skip("NO_EVENT");
    }

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return skip("TICKET_NOT_FOUND");

    // Already branched. Moving a ticket out of the column and back in must not
    // hit GitHub again.
    if (ticket.githubBranchName) {
      return {
        ran: true,
        ok: true,
        branch: ticket.githubBranchName,
        alreadyExisted: true,
        repoId: ticket.repoId ?? null,
      };
    }

    const resolvedRepo = await resolveRepositoryForTicket(ticket);
    if (resolvedRepo.reason) return skip(resolvedRepo.reason);
    const repo = resolvedRepo.repo;

    const parsed = parseRepoUrl(repo.url);
    if (!parsed) return skip("REPO_URL_UNPARSEABLE");

    const resolvedToken = await resolveTokenForUser(actingUserId);
    if (resolvedToken.reason) return skip(resolvedToken.reason);
    const token = resolvedToken.token;

    const branch = buildBranchName(ticket);

    let sha;
    try {
      sha = await github.getRefSha({
        token: token,
        owner: parsed.owner,
        repo: parsed.repoName,
        branch: repo.developmentBranch,
      });
    } catch (err) {
      // A 404 here is the base branch, not the repo — by far the most common
      // misconfiguration (main vs master vs dev).
      if (err.code === "NOT_FOUND") {
        return {
          ran: true,
          ok: false,
          code: "BASE_BRANCH_NOT_FOUND",
          message: `The repository has no branch named "${repo.developmentBranch}".`,
        };
      }
      throw err;
    }

    const created = await github.createBranch({
      token: token,
      owner: parsed.owner,
      repo: parsed.repoName,
      branch: branch,
      sha: sha,
    });

    await Ticket.update(
      { githubBranchName: branch, repoId: repo.id },
      { where: { id: ticketId } }
    );

    // Log the action to the user activity log
    try {
      await UserActivityLog.create({
        userId: actingUserId,
        action: LogActions.GITHUB_BRANCH_CREATED,
        detail: ` created branch "${branch}" for ticket "${ticket.title}"`,
        ipAddress: req?.ip,
        userAgent: req?.headers?.["user-agent"],
      });
    } catch (error) {
      console.log("Error writing GITHUB_BRANCH_CREATED action to User Activity Log: ", error);
    }

    return {
      ran: true,
      ok: true,
      branch: branch,
      alreadyExisted: !created.created,
      repoId: repo.id,
    };
  } catch (err) {
    if (err && err.name === "GithubApiError") {
      return { ran: true, ok: false, code: err.code, message: err.message };
    }
    console.log("Unexpected error running GitHub status automation: ", err);
    return { ran: true, ok: false, code: "UNKNOWN", message: "GitHub automation failed." };
  }
};

module.exports = { runStatusChangeAutomation };
