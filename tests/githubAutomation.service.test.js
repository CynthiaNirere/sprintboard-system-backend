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
        message: 'The repository has no branch named "dev".',
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

});
