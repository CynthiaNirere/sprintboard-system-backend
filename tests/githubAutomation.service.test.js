const automation = require("../app/services/githubAutomation.service");
const db = require("../app/models");
const github = require("../app/services/github.service");
const { decrypt } = require("../app/authentication/crypto");

const Ticket = db.ticket;
const BoardStatus = db.boardStatus;
const Repo = db.githubRepository;
const User = db.user;

jest.mock("../app/models", () => {
  const user = { findByPk: jest.fn() };
  user.scope = jest.fn(() => user);

  return {
    ticket: { findByPk: jest.fn(), update: jest.fn() },
    boardStatus: { findByPk: jest.fn(), rawAttributes: { githubEvent: {} } },
    githubRepository: { findByPk: jest.fn(), findAll: jest.fn() },
    user: user,
    userActivityLog: { create: jest.fn() },
  };
});

jest.mock("../app/services/github.service", () => ({
  getRefSha: jest.fn(),
  createBranch: jest.fn(),
  createPullRequest: jest.fn(),
  findPullRequestForBranch: jest.fn(),
  validateToken: jest.fn(),
}));

jest.mock("../app/authentication/crypto", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

const TICKET = {
  id: 42,
  title: "Fix the login redirect",
  type: "BUG",
  projectId: 1,
  repoId: null,
  githubBranchName: null,
};

const REPO = {
  id: 3,
  projectId: 1,
  url: "https://github.com/acme/widgets",
  developmentBranch: "dev",
};

const run = (overrides) =>
  automation.runStatusChangeAutomation({
    ticketId: 42,
    newStatusId: 2,
    actingUserId: 9,
    req: {},
    ...overrides,
  });

describe("runStatusChangeAutomation", () => {

  beforeEach(() => {
    jest.clearAllMocks();

    BoardStatus.findByPk.mockResolvedValue({ id: 2, githubEvent: "CREATE_BRANCH" });
    Ticket.findByPk.mockResolvedValue({ ...TICKET });
    Ticket.update.mockResolvedValue([1]);
    Repo.findAll.mockResolvedValue([{ ...REPO }]);
    User.findByPk.mockResolvedValue({ id: 9, githubToken: "encrypted-blob" });
    decrypt.mockResolvedValue("ghp_realtoken");
    github.getRefSha.mockResolvedValue("basesha");
    github.createBranch.mockResolvedValue({ created: true, ref: "refs/heads/x" });
    github.createPullRequest.mockResolvedValue({
      number: 7,
      url: "https://github.com/acme/widgets/pull/7",
    });
    github.findPullRequestForBranch.mockResolvedValue(null);
  });


  describe("short circuits", () => {

    it("does nothing when the status carries no event", async () => {
      BoardStatus.findByPk.mockResolvedValue({ id: 2, githubEvent: null });

      const result = await run();

      expect(result).toEqual({ ran: false, reason: "NO_EVENT" });
      expect(Ticket.findByPk).not.toHaveBeenCalled();
      expect(github.getRefSha).not.toHaveBeenCalled();
    });


    it("does nothing when the status carries a different event", async () => {
      BoardStatus.findByPk.mockResolvedValue({ id: 2, githubEvent: "ON_PR_MERGED" });

      expect(await run()).toEqual({ ran: false, reason: "NO_EVENT" });
      expect(github.getRefSha).not.toHaveBeenCalled();
    });


    it.each([
      ["pr_opened"],
      ["pr_merged"],
    ])("ignores the inbound %s event — that is the webhook's job", async (event) => {
      BoardStatus.findByPk.mockResolvedValue({ id: 2, githubEvent: event });

      expect(await run()).toEqual({ ran: false, reason: "NO_EVENT" });
      expect(github.getRefSha).not.toHaveBeenCalled();
      expect(github.createPullRequest).not.toHaveBeenCalled();
    });


    it("reports a missing ticket", async () => {
      Ticket.findByPk.mockResolvedValue(null);

      expect(await run()).toEqual({ ran: false, reason: "TICKET_NOT_FOUND" });
    });


    it("does not call GitHub again once the branch has been created", async () => {
      Ticket.findByPk.mockResolvedValue({
        ...TICKET,
        githubBranchName: "bugfix/fix-the-login-redirect",
        githubBranchCreatedAt: new Date("2026-08-01T10:00:00Z"),
        repoId: 3,
      });

      const result = await run();

      expect(result).toEqual({
        ran: true,
        ok: true,
        branch: "bugfix/fix-the-login-redirect",
        alreadyExisted: true,
        repoId: 3,
      });
      expect(github.getRefSha).not.toHaveBeenCalled();
      expect(github.createBranch).not.toHaveBeenCalled();
    });


    it("still creates the branch when a name is set but nothing was created yet", async () => {
      // A name on its own is a request, not a record — this is the case that
      // used to silently do nothing and report success.
      Ticket.findByPk.mockResolvedValue({
        ...TICKET,
        githubBranchName: "spike/try-redis",
        githubBranchCreatedAt: null,
      });

      const result = await run();

      expect(github.createBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branch: "spike/try-redis" })
      );
      expect(result.ok).toBe(true);
      expect(result.branch).toBe("spike/try-redis");
    });

  });


  describe("requested branch names", () => {

    it("uses the name on the ticket verbatim", async () => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, githubBranchName: "fix/login-redirect" });

      await run();

      expect(github.createBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branch: "fix/login-redirect" })
      );
    });


    it("strips a refs/heads/ prefix", async () => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, githubBranchName: "refs/heads/foo" });

      const result = await run();

      expect(github.createBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branch: "foo" })
      );
      expect(result.branch).toBe("foo");
    });


    it("falls back to the convention for a whitespace-only name", async () => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, githubBranchName: "   " });

      const result = await run();

      expect(result.branch).toBe("bugfix/fix-the-login-redirect");
    });


    it.each([
      ["a space", "my branch"],
      ["a double dot", "feature/a..b"],
      ["a trailing slash", "bad/"],
      ["a .lock suffix", "feature/x.lock"],
      ["a tilde", "feature/~x"],
      ["a leading dot in a component", "feature/.hidden"],
    ])("rejects %s before doing any work", async (_label, name) => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, githubBranchName: name });

      const result = await run();

      expect(result).toEqual({
        ran: true,
        ok: false,
        code: "INVALID_BRANCH_NAME",
        message: `"${name}" is not a valid git branch name.`,
      });
      // Cheap failure: no repo lookup, no token decrypt, no network.
      expect(Repo.findAll).not.toHaveBeenCalled();
      expect(User.findByPk).not.toHaveBeenCalled();
      expect(github.getRefSha).not.toHaveBeenCalled();
      expect(Ticket.update).not.toHaveBeenCalled();
    });

  });


  describe("repository resolution", () => {

    it("reports when the project has no linked repo", async () => {
      Repo.findAll.mockResolvedValue([]);

      expect(await run()).toEqual({ ran: false, reason: "NO_REPO_LINKED" });
      expect(github.getRefSha).not.toHaveBeenCalled();
    });


    it("refuses to guess when the project has several repos", async () => {
      Repo.findAll.mockResolvedValue([{ ...REPO }, { ...REPO, id: 4 }]);

      expect(await run()).toEqual({ ran: false, reason: "AMBIGUOUS_REPO" });
      expect(github.getRefSha).not.toHaveBeenCalled();
    });


    it("uses the ticket's repoId when it is set", async () => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, repoId: 3 });
      Repo.findByPk.mockResolvedValue({ ...REPO });

      const result = await run();

      expect(Repo.findByPk).toHaveBeenCalledWith(3);
      expect(Repo.findAll).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });


    it("refuses a repoId belonging to another project", async () => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, repoId: 99 });
      Repo.findByPk.mockResolvedValue({ ...REPO, id: 99, projectId: 77 });

      expect(await run()).toEqual({ ran: false, reason: "REPO_PROJECT_MISMATCH" });
      expect(github.getRefSha).not.toHaveBeenCalled();
    });


    it("reports a url it cannot parse", async () => {
      Repo.findAll.mockResolvedValue([{ ...REPO, url: "not a url" }]);

      expect(await run()).toEqual({ ran: false, reason: "REPO_URL_UNPARSEABLE" });
    });

  });


  describe("token resolution", () => {

    it("reports when the acting user has no token", async () => {
      User.findByPk.mockResolvedValue({ id: 9, githubToken: null });

      expect(await run()).toEqual({ ran: false, reason: "NO_TOKEN" });
      expect(github.getRefSha).not.toHaveBeenCalled();
    });


    it("reports when there is no acting user at all", async () => {
      expect(await run({ actingUserId: null })).toEqual({ ran: false, reason: "NO_TOKEN" });
      expect(User.findByPk).not.toHaveBeenCalled();
    });


    it("reports an undecryptable token rather than throwing", async () => {
      decrypt.mockRejectedValue(new Error("[object Object]"));

      expect(await run()).toEqual({ ran: false, reason: "TOKEN_UNREADABLE" });
    });


    it("uses the acting user's token, not the assignee's", async () => {
      await run({ actingUserId: 9 });

      expect(User.findByPk).toHaveBeenCalledWith(9);
      expect(github.getRefSha).toHaveBeenCalledWith(
        expect.objectContaining({ token: "ghp_realtoken" })
      );
    });

  });


  describe("branch creation", () => {

    it("branches off the repo's development branch and records the result", async () => {
      const result = await run();

      expect(github.getRefSha).toHaveBeenCalledWith({
        token: "ghp_realtoken",
        owner: "acme",
        repo: "widgets",
        branch: "dev",
      });
      expect(github.createBranch).toHaveBeenCalledWith({
        token: "ghp_realtoken",
        owner: "acme",
        repo: "widgets",
        branch: "bugfix/fix-the-login-redirect",
        sha: "basesha",
      });

      const [updateData, where] = Ticket.update.mock.calls[0];
      expect(updateData.githubBranchName).toBe("bugfix/fix-the-login-redirect");
      expect(updateData.repoId).toBe(3);
      expect(updateData.githubBranchCreatedAt).toBeInstanceOf(Date);
      expect(where).toEqual({ where: { id: 42 } });

      expect(result).toEqual({
        ran: true,
        ok: true,
        branch: "bugfix/fix-the-login-redirect",
        alreadyExisted: false,
        repoId: 3,
      });
    });


    it("still records and stamps the branch when it already existed on GitHub", async () => {
      github.createBranch.mockResolvedValue({ created: false, ref: "refs/heads/x" });

      const result = await run();

      expect(Ticket.update.mock.calls[0][0].githubBranchCreatedAt).toBeInstanceOf(Date);
      expect(result.ok).toBe(true);
      expect(result.alreadyExisted).toBe(true);
    });


    it("reports a missing base branch and does not touch the ticket", async () => {
      const err = new Error("Not found");
      err.name = "GithubApiError";
      err.code = "NOT_FOUND";
      github.getRefSha.mockRejectedValue(err);

      const result = await run();

      expect(result).toEqual({
        ran: true,
        ok: false,
        code: "BASE_BRANCH_NOT_FOUND",
        // A 404 means either cause, so the message must not blame only one.
        message:
          'The repository has no branch named "dev", or the token cannot see this repository.',
      });
      expect(github.createBranch).not.toHaveBeenCalled();
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("reports a rejected token without throwing", async () => {
      const err = new Error("GitHub rejected the token.");
      err.name = "GithubApiError";
      err.code = "BAD_TOKEN";
      github.createBranch.mockRejectedValue(err);

      const result = await run();

      expect(result).toEqual({
        ran: true,
        ok: false,
        code: "BAD_TOKEN",
        message: "GitHub rejected the token.",
      });
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("swallows an unexpected error rather than throwing at the caller", async () => {
      Ticket.update.mockRejectedValue(new Error("db down"));

      const result = await run();

      expect(result).toEqual({
        ran: true,
        ok: false,
        code: "UNKNOWN",
        message: "GitHub automation failed.",
      });
    });


    it("does not fail when writing the activity log throws", async () => {
      db.userActivityLog.create.mockRejectedValue(new Error("log down"));

      const result = await run();

      expect(result.ok).toBe(true);
    });


    it("survives a req with no headers", async () => {
      const result = await run({ req: {} });

      expect(result.ok).toBe(true);
    });

  });


  describe("pull request creation", () => {

    const BRANCHED = {
      ...TICKET,
      description: "Users are bounced to / after signing in.",
      githubBranchName: "bugfix/users-cannot-login",
      githubBranchCreatedAt: new Date("2026-08-01T10:00:00Z"),
    };

    beforeEach(() => {
      BoardStatus.findByPk.mockResolvedValue({ id: 4, githubEvent: "create_pr" });
      Ticket.findByPk.mockResolvedValue({ ...BRANCHED });
    });


    it("opens a PR titled with the ticket title and bodied with its description", async () => {
      const result = await run({ newStatusId: 4 });

      expect(github.createPullRequest).toHaveBeenCalledWith({
        token: "ghp_realtoken",
        owner: "acme",
        repo: "widgets",
        head: "bugfix/users-cannot-login",
        base: "dev",
        title: "Fix the login redirect",
        body: "Users are bounced to / after signing in.",
      });

      expect(result).toEqual({
        ran: true,
        ok: true,
        pullRequestUrl: "https://github.com/acme/widgets/pull/7",
        pullRequestNumber: 7,
        alreadyExisted: false,
        repoId: 3,
      });
    });


    it("records the PR url on the ticket", async () => {
      await run({ newStatusId: 4 });

      expect(Ticket.update).toHaveBeenCalledWith(
        { githubPrURL: "https://github.com/acme/widgets/pull/7", repoId: 3 },
        { where: { id: 42 } }
      );
    });


    it("never creates a branch", async () => {
      await run({ newStatusId: 4 });

      expect(github.createBranch).not.toHaveBeenCalled();
      expect(github.getRefSha).not.toHaveBeenCalled();
    });


    it("skips when the ticket has no branch", async () => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, githubBranchName: null });

      const result = await run({ newStatusId: 4 });

      expect(result).toEqual({ ran: false, reason: "NO_BRANCH" });
      expect(github.createPullRequest).not.toHaveBeenCalled();
      expect(Repo.findAll).not.toHaveBeenCalled();
    });


    it("skips when the branch name is only whitespace", async () => {
      Ticket.findByPk.mockResolvedValue({ ...TICKET, githubBranchName: "   " });

      expect(await run({ newStatusId: 4 })).toEqual({ ran: false, reason: "NO_BRANCH" });
    });


    it("does not open a second PR when one is already recorded", async () => {
      Ticket.findByPk.mockResolvedValue({
        ...BRANCHED,
        githubPrURL: "https://github.com/acme/widgets/pull/3",
        repoId: 3,
      });

      const result = await run({ newStatusId: 4 });

      expect(github.createPullRequest).not.toHaveBeenCalled();
      expect(result).toEqual({
        ran: true,
        ok: true,
        pullRequestUrl: "https://github.com/acme/widgets/pull/3",
        alreadyExisted: true,
        repoId: 3,
      });
    });


    describe("when a pull request already exists on GitHub", () => {

      const prExists = () => {
        const err = new Error("A pull request for that branch already exists.");
        err.name = "GithubApiError";
        err.code = "PR_EXISTS";
        github.createPullRequest.mockRejectedValue(err);
      };


      it("looks the existing PR up and records its url", async () => {
        prExists();
        github.findPullRequestForBranch.mockResolvedValue({
          number: 3,
          url: "https://github.com/acme/widgets/pull/3",
        });

        const result = await run({ newStatusId: 4 });

        expect(github.findPullRequestForBranch).toHaveBeenCalledWith({
          token: "ghp_realtoken",
          owner: "acme",
          repo: "widgets",
          head: "bugfix/users-cannot-login",
        });
        expect(Ticket.update).toHaveBeenCalledWith(
          { githubPrURL: "https://github.com/acme/widgets/pull/3", repoId: 3 },
          { where: { id: 42 } }
        );
        expect(result).toEqual({
          ran: true,
          ok: true,
          pullRequestUrl: "https://github.com/acme/widgets/pull/3",
          pullRequestNumber: 3,
          alreadyExisted: true,
          repoId: 3,
        });
      });


      it("logs it as a link rather than an open", async () => {
        prExists();
        github.findPullRequestForBranch.mockResolvedValue({
          number: 3,
          url: "https://github.com/acme/widgets/pull/3",
        });

        await run({ newStatusId: 4 });

        expect(db.userActivityLog.create.mock.calls[0][0].detail).toContain("linked existing");
      });


      it("reports the state without a url when the PR cannot be found", async () => {
        prExists();
        github.findPullRequestForBranch.mockResolvedValue(null);

        const result = await run({ newStatusId: 4 });

        expect(result.ok).toBe(true);
        expect(result.alreadyExisted).toBe(true);
        expect(result.pullRequestUrl).toBeUndefined();
        expect(Ticket.update).not.toHaveBeenCalled();
      });


      it("surfaces a failure of the lookup itself", async () => {
        prExists();
        const lookupErr = new Error("GitHub rejected the token.");
        lookupErr.name = "GithubApiError";
        lookupErr.code = "BAD_TOKEN";
        github.findPullRequestForBranch.mockRejectedValue(lookupErr);

        const result = await run({ newStatusId: 4 });

        expect(result).toEqual({
          ran: true,
          ok: false,
          code: "BAD_TOKEN",
          message: "GitHub rejected the token.",
        });
        expect(Ticket.update).not.toHaveBeenCalled();
      });

    });


    it("reports a branch with no commits without touching the ticket", async () => {
      const err = new Error("The branch has no commits that the base branch does not already have.");
      err.name = "GithubApiError";
      err.code = "NO_COMMITS";
      github.createPullRequest.mockRejectedValue(err);

      const result = await run({ newStatusId: 4 });

      expect(result).toEqual({
        ran: true,
        ok: false,
        code: "NO_COMMITS",
        message: "The branch has no commits that the base branch does not already have.",
      });
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("sends an empty body when the ticket has no description", async () => {
      Ticket.findByPk.mockResolvedValue({ ...BRANCHED, description: null });

      await run({ newStatusId: 4 });

      expect(github.createPullRequest).toHaveBeenCalledWith(
        expect.objectContaining({ body: null })
      );
    });


    it("leaves an existing repoId alone", async () => {
      Ticket.findByPk.mockResolvedValue({ ...BRANCHED, repoId: 3 });
      Repo.findByPk.mockResolvedValue({ ...REPO });

      await run({ newStatusId: 4 });

      expect(Ticket.update.mock.calls[0][0]).not.toHaveProperty("repoId");
    });


    it("still reports NO_TOKEN when the acting user has none", async () => {
      User.findByPk.mockResolvedValue({ id: 9, githubToken: null });

      expect(await run({ newStatusId: 4 })).toEqual({ ran: false, reason: "NO_TOKEN" });
      expect(github.createPullRequest).not.toHaveBeenCalled();
    });


    it("logs the pull request against the acting user", async () => {
      await run({ newStatusId: 4 });

      const logged = db.userActivityLog.create.mock.calls[0][0];
      expect(logged.userId).toBe(9);
      expect(logged.action).toBe("GitHub PR created");
      expect(logged.detail).toContain("#7");
    });

  });

});
