const github = require("../app/services/github.service");

const {
  GithubApiError,
  getRefSha,
  createBranch,
  createPullRequest,
  findPullRequestForBranch,
  validateToken,
} = github;

const TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz0123456789";

const makeHeaders = (headers) => ({
  get: (key) => {
    const found = headers[String(key).toLowerCase()];
    return found === undefined ? null : found;
  },
});

const okResponse = (body, headers = {}) => ({
  ok: true,
  status: 200,
  json: async () => body,
  headers: makeHeaders(headers),
});

const errorResponse = (status, body, headers = {}) => ({
  ok: false,
  status: status,
  json: async () => body,
  headers: makeHeaders(headers),
});

describe("github.service", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
  });

  describe("getRefSha", () => {

    it("returns the commit sha for a branch", async () => {
      global.fetch.mockResolvedValue(
        okResponse({ object: { sha: "abc123" } })
      );

      const sha = await getRefSha({
        token: TOKEN,
        owner: "acme",
        repo: "widgets",
        branch: "dev",
      });

      expect(sha).toBe("abc123");
    });


    it("sends the expected url, method and headers", async () => {
      global.fetch.mockResolvedValue(
        okResponse({ object: { sha: "abc123" } })
      );

      await getRefSha({ token: TOKEN, owner: "acme", repo: "widgets", branch: "dev" });

      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toBe("https://api.github.com/repos/acme/widgets/git/ref/heads/dev");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      expect(options.headers["User-Agent"]).toBe("sprintboard-backend");
      expect(options.headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
      expect(options.signal).toBeDefined();
    });


    it("keeps slashes literal in a branch name but encodes the owner and repo", async () => {
      global.fetch.mockResolvedValue(
        okResponse({ object: { sha: "abc123" } })
      );

      await getRefSha({
        token: TOKEN,
        owner: "acme",
        repo: "widgets",
        branch: "release/2.0",
      });

      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://api.github.com/repos/acme/widgets/git/ref/heads/release/2.0"
      );
    });


    it("throws NOT_FOUND when the ref does not exist", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(404, { message: "Not Found" })
      );

      await expect(
        getRefSha({ token: TOKEN, owner: "acme", repo: "widgets", branch: "nope" })
      ).rejects.toMatchObject({ name: "GithubApiError", code: "NOT_FOUND" });
    });

  });


  describe("createBranch", () => {

    it("creates the branch and reports created:true", async () => {
      global.fetch.mockResolvedValue(
        okResponse({ ref: "refs/heads/feature/ticket-1-x" })
      );

      const result = await createBranch({
        token: TOKEN,
        owner: "acme",
        repo: "widgets",
        branch: "feature/ticket-1-x",
        sha: "abc123",
      });

      expect(result).toEqual({ created: true, ref: "refs/heads/feature/ticket-1-x" });

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe("https://api.github.com/repos/acme/widgets/git/refs");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({
        ref: "refs/heads/feature/ticket-1-x",
        sha: "abc123",
      });
    });


    it("treats an existing branch as success, not an error", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(422, { message: "Reference already exists" })
      );

      const result = await createBranch({
        token: TOKEN,
        owner: "acme",
        repo: "widgets",
        branch: "feature/ticket-1-x",
        sha: "abc123",
      });

      expect(result).toEqual({ created: false, ref: "refs/heads/feature/ticket-1-x" });
    });


    it("still throws INVALID for other 422s", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(422, { message: "Invalid ref name" })
      );

      await expect(
        createBranch({ token: TOKEN, owner: "acme", repo: "widgets", branch: "..", sha: "abc" })
      ).rejects.toMatchObject({ code: "INVALID" });
    });

  });


  describe("createPullRequest", () => {

    const args = {
      token: TOKEN,
      owner: "acme",
      repo: "widgets",
      head: "bugfix/users-cannot-login",
      base: "dev",
      title: "Fix the login redirect",
      body: "Users are bounced to / after signing in.",
    };


    it("opens the pull request and returns its number and url", async () => {
      global.fetch.mockResolvedValue(
        okResponse({ number: 7, html_url: "https://github.com/acme/widgets/pull/7" })
      );

      const result = await createPullRequest(args);

      expect(result).toEqual({ number: 7, url: "https://github.com/acme/widgets/pull/7" });

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe("https://api.github.com/repos/acme/widgets/pulls");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({
        title: "Fix the login redirect",
        body: "Users are bounced to / after signing in.",
        head: "bugfix/users-cannot-login",
        base: "dev",
      });
    });


    it("sends an empty string body rather than null", async () => {
      global.fetch.mockResolvedValue(okResponse({ number: 8, html_url: "u" }));

      await createPullRequest({ ...args, body: null });

      expect(JSON.parse(global.fetch.mock.calls[0][1].body).body).toBe("");
    });


    it("maps an existing pull request to PR_EXISTS", async () => {
      // GitHub puts the useful text in errors[], not the top-level message.
      global.fetch.mockResolvedValue(
        errorResponse(422, {
          message: "Validation Failed",
          errors: [{ message: "A pull request already exists for acme:bugfix/users-cannot-login." }],
        })
      );

      await expect(createPullRequest(args)).rejects.toMatchObject({ code: "PR_EXISTS" });
    });


    it("maps an empty branch to NO_COMMITS", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(422, {
          message: "Validation Failed",
          errors: [{ message: "No commits between dev and bugfix/users-cannot-login" }],
        })
      );

      await expect(createPullRequest(args)).rejects.toMatchObject({ code: "NO_COMMITS" });
    });


    it("maps any other validation failure to INVALID", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(422, {
          message: "Validation Failed",
          errors: [{ message: "Field 'head' is invalid" }],
        })
      );

      await expect(createPullRequest(args)).rejects.toMatchObject({ code: "INVALID" });
    });


    it("never leaks the token when it appears inside errors[]", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(422, { message: "Validation Failed", errors: [{ message: TOKEN }] })
      );

      let caught;
      try {
        await createPullRequest(args);
      } catch (err) {
        caught = err;
      }

      expect(`${caught.message} ${caught.stack}`).not.toContain(TOKEN);
    });

  });


  describe("findPullRequestForBranch", () => {

    const args = {
      token: TOKEN,
      owner: "acme",
      repo: "widgets",
      head: "bugfix/users-cannot-login",
    };


    it("returns the first open pull request for the branch", async () => {
      global.fetch.mockResolvedValue(
        okResponse([
          { number: 3, html_url: "https://github.com/acme/widgets/pull/3" },
          { number: 9, html_url: "https://github.com/acme/widgets/pull/9" },
        ])
      );

      expect(await findPullRequestForBranch(args)).toEqual({
        number: 3,
        url: "https://github.com/acme/widgets/pull/3",
      });
    });


    it("qualifies the head filter with the owner and asks only for open PRs", async () => {
      global.fetch.mockResolvedValue(okResponse([]));

      await findPullRequestForBranch(args);

      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://api.github.com/repos/acme/widgets/pulls" +
          "?head=acme%3Abugfix%2Fusers-cannot-login&state=open"
      );
    });


    it("returns null when nothing matches", async () => {
      global.fetch.mockResolvedValue(okResponse([]));

      expect(await findPullRequestForBranch(args)).toBeNull();
    });


    it("returns null when the response is not a list", async () => {
      global.fetch.mockResolvedValue(okResponse(null));

      expect(await findPullRequestForBranch(args)).toBeNull();
    });

  });


  describe("error mapping", () => {

    it("maps 401 to BAD_TOKEN", async () => {
      global.fetch.mockResolvedValue(errorResponse(401, { message: "Bad credentials" }));

      await expect(validateToken(TOKEN)).rejects.toMatchObject({ code: "BAD_TOKEN" });
    });


    it("maps a 403 with no remaining rate limit to RATE_LIMITED", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(403, { message: "rate limit" }, { "x-ratelimit-remaining": "0" })
      );

      await expect(validateToken(TOKEN)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    });


    it("maps a plain 403 to FORBIDDEN", async () => {
      global.fetch.mockResolvedValue(
        errorResponse(403, { message: "Resource not accessible" }, { "x-ratelimit-remaining": "48" })
      );

      await expect(validateToken(TOKEN)).rejects.toMatchObject({ code: "FORBIDDEN" });
    });


    it("maps a timed-out fetch to TIMEOUT", async () => {
      const timeout = new Error("timed out");
      timeout.name = "TimeoutError";
      global.fetch.mockRejectedValue(timeout);

      await expect(validateToken(TOKEN)).rejects.toMatchObject({ code: "TIMEOUT" });
    });


    it("maps a failed fetch to NETWORK", async () => {
      global.fetch.mockRejectedValue(new TypeError("fetch failed"));

      await expect(validateToken(TOKEN)).rejects.toMatchObject({ code: "NETWORK" });
    });


    it("never leaks the token in an error message", async () => {
      global.fetch.mockResolvedValue(errorResponse(403, { message: TOKEN }));

      let caught;
      try {
        await getRefSha({ token: TOKEN, owner: "acme", repo: "widgets", branch: "dev" });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(GithubApiError);
      expect(`${caught.message} ${caught.stack}`).not.toContain(TOKEN);
    });

  });


  describe("validateToken", () => {

    it("returns the login and parsed scopes", async () => {
      global.fetch.mockResolvedValue(
        okResponse({ login: "justin" }, { "x-oauth-scopes": "repo, read:org" })
      );

      const result = await validateToken(TOKEN);

      expect(result).toEqual({ login: "justin", scopes: ["repo", "read:org"] });
      expect(global.fetch.mock.calls[0][0]).toBe("https://api.github.com/user");
    });


    it("reports no scopes for a fine-grained token", async () => {
      global.fetch.mockResolvedValue(okResponse({ login: "justin" }));

      const result = await validateToken(TOKEN);

      expect(result).toEqual({ login: "justin", scopes: [] });
    });

  });


  it("honours GITHUB_API_BASE", async () => {
    process.env.GITHUB_API_BASE = "https://github.example.com/api/v3";
    global.fetch.mockResolvedValue(okResponse({ login: "justin" }));

    await validateToken(TOKEN);

    expect(global.fetch.mock.calls[0][0]).toBe("https://github.example.com/api/v3/user");

    delete process.env.GITHUB_API_BASE;
  });

});
