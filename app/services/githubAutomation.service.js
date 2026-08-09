// Orchestrates what happens when a ticket lands in a board status that carries
// a GitHub automation event. Keeps the controller thin.
//
// The single entry point never throws and never touches `res` — a GitHub
// outage must not stop somebody from moving a card.

const db = require("../models");
const { decrypt } = require("../authentication/crypto");
const github = require("./github.service");
const { parseRepoUrl } = require("./githubUrl");
const {
  buildBranchName,
  normaliseBranchName,
  isValidBranchName,
} = require("./githubBranchName");
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
 * Everything an outbound action needs before it can call GitHub: which
 * repository, its owner/name, and whose token to use.
 * @return {Promise<{repo, owner, repoName, token} | {reason: string}>}
 */
const resolveGithubContext = async (ticket, actingUserId) => {
  const resolvedRepo = await resolveRepositoryForTicket(ticket);
  if (resolvedRepo.reason) return { reason: resolvedRepo.reason };
  const repo = resolvedRepo.repo;

  const parsed = parseRepoUrl(repo.url);
  if (!parsed) return { reason: "REPO_URL_UNPARSEABLE" };

  const resolvedToken = await resolveTokenForUser(actingUserId);
  if (resolvedToken.reason) return { reason: resolvedToken.reason };

  return {
    repo: repo,
    owner: parsed.owner,
    repoName: parsed.repoName,
    token: resolvedToken.token,
  };
};

/**
 * Activity logging must never fail the action it is recording.
 */
const writeLog = async ({ actingUserId, req, action, detail }) => {
  try {
    await UserActivityLog.create({
      userId: actingUserId,
      action: action,
      detail: detail,
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
    });
  } catch (error) {
    console.log(`Error writing ${action} action to User Activity Log: `, error);
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
    const event = getStatusEvent(status);

    if (event !== AutomationEvents.CREATE_BRANCH && event !== AutomationEvents.CREATE_PR) {
      // PR_OPENED and PR_MERGED are inbound — they are the webhook's business,
      // not something a ticket move triggers.
      return skip("NO_EVENT");
    }

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return skip("TICKET_NOT_FOUND");

    return event === AutomationEvents.CREATE_BRANCH
      ? await runCreateBranch({ ticket, ticketId, actingUserId, req })
      : await runCreatePullRequest({ ticket, ticketId, actingUserId, req });
  } catch (err) {
    if (err && err.name === "GithubApiError") {
      return { ran: true, ok: false, code: err.code, message: err.message };
    }
    console.log("Unexpected error running GitHub status automation: ", err);
    return { ran: true, ok: false, code: "UNKNOWN", message: "GitHub automation failed." };
  }
};

/**
 * Cuts the ticket's branch. Both outbound actions need the same three things —
 * a repository, its owner/name, and the acting user's token — so that part is
 * shared in resolveGithubContext.
 */
const runCreateBranch = async ({ ticket, ticketId, actingUserId, req }) => {
  // Already branched. Moving a ticket out of the column and back in must not
  // hit GitHub again. Keyed off the stamp rather than the name, because a
  // name on its own may be one somebody typed for a branch that does not
  // exist yet.
  if (ticket.githubBranchCreatedAt) {
    return {
      ran: true,
      ok: true,
      branch: ticket.githubBranchName,
      alreadyExisted: true,
      repoId: ticket.repoId ?? null,
    };
  }

  // A name on the ticket is a request for that exact branch; an empty field
  // means "use the convention". Validate before touching the repo, the token
  // or the network, so a typo costs nothing.
  const requested = normaliseBranchName(ticket.githubBranchName);
  if (requested && !isValidBranchName(requested)) {
    return {
      ran: true,
      ok: false,
      code: "INVALID_BRANCH_NAME",
      message: `"${requested}" is not a valid git branch name.`,
    };
  }

  const context = await resolveGithubContext(ticket, actingUserId);
  if (context.reason) return skip(context.reason);
  const { repo, owner, repoName, token } = context;

  const branch = requested || buildBranchName(ticket);

  let sha;
  try {
    sha = await github.getRefSha({
      token: token,
      owner: owner,
      repo: repoName,
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
        message: `The repository has no branch named "${repo.developmentBranch}", or the token cannot see this repository.`,
      };
    }
    throw err;
  }

  const created = await github.createBranch({
    token: token,
    owner: owner,
    repo: repoName,
    branch: branch,
    sha: sha,
  });

  await Ticket.update(
    { githubBranchName: branch, repoId: repo.id, githubBranchCreatedAt: new Date() },
    { where: { id: ticketId } }
  );

  await writeLog({
    actingUserId,
    req,
    action: LogActions.GITHUB_BRANCH_CREATED,
    detail: ` created branch "${branch}" for ticket "${ticket.title}"`,
  });

  return {
    ran: true,
    ok: true,
    branch: branch,
    alreadyExisted: !created.created,
    repoId: repo.id,
  };
};

/**
 * Opens a pull request from the ticket's branch into the repository's
 * development branch, titled with the ticket title and described with the
 * ticket description.
 */
const runCreatePullRequest = async ({ ticket, ticketId, actingUserId, req }) => {
  // A recorded PR url means one exists — whether this automation opened it or
  // the pr_opened webhook saw somebody else open it.
  if (ticket.githubPrURL) {
    return {
      ran: true,
      ok: true,
      pullRequestUrl: ticket.githubPrURL,
      alreadyExisted: true,
      repoId: ticket.repoId ?? null,
    };
  }

  // A pull request needs a branch with commits on it. Cutting one here would
  // just produce a branch with nothing to merge.
  const branch = normaliseBranchName(ticket.githubBranchName);
  if (!branch) return skip("NO_BRANCH");

  const context = await resolveGithubContext(ticket, actingUserId);
  if (context.reason) return skip(context.reason);
  const { repo, owner, repoName, token } = context;

  let pull;
  let alreadyExisted = false;

  try {
    pull = await github.createPullRequest({
      token: token,
      owner: owner,
      repo: repoName,
      head: branch,
      base: repo.developmentBranch,
      title: ticket.title,
      body: ticket.description,
    });
  } catch (err) {
    if (err.code !== "PR_EXISTS") throw err;

    // GitHub does not hand back the pull request on that error, so go and find
    // it — the point of this branch is to end up with its url on the ticket.
    alreadyExisted = true;
    pull = await github.findPullRequestForBranch({
      token: token,
      owner: owner,
      repo: repoName,
      head: branch,
    });

    if (!pull) {
      // It exists (GitHub just said so) but is not visible on the open list —
      // nothing to record, so report the state without a url.
      return {
        ran: true,
        ok: true,
        alreadyExisted: true,
        repoId: repo.id,
        message: err.message,
      };
    }
  }

  const updateData = { githubPrURL: pull.url };
  if (ticket.repoId == null) updateData.repoId = repo.id;
  await Ticket.update(updateData, { where: { id: ticketId } });

  await writeLog({
    actingUserId,
    req,
    action: LogActions.GITHUB_PR_CREATED,
    detail: alreadyExisted
      ? ` linked existing pull request #${pull.number} to ticket "${ticket.title}"`
      : ` opened pull request #${pull.number} for ticket "${ticket.title}"`,
  });

  return {
    ran: true,
    ok: true,
    pullRequestUrl: pull.url,
    pullRequestNumber: pull.number,
    alreadyExisted: alreadyExisted,
    repoId: repo.id,
  };
};

module.exports = { runStatusChangeAutomation };
