// Thin GitHub REST client built on global fetch (Node 18+). Deliberately has no
// dependency on ../models — it takes a token string plus owner/repo and returns
// plain data, which keeps it testable by stubbing global.fetch.

const API_BASE = () => process.env.GITHUB_API_BASE || "https://api.github.com";
const TIMEOUT_MS = 10000;

/**
 * Every failure surfaces as one of these, so callers switch on `code` rather
 * than parsing GitHub's prose.
 */
class GithubApiError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = "GithubApiError";
    this.code = code;
    this.status = status;
  }
}

const readHeader = (res, name) => {
  try {
    return res.headers && typeof res.headers.get === "function"
      ? res.headers.get(name)
      : null;
  } catch {
    return null;
  }
};

const readBody = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Maps a non-2xx response onto a GithubApiError. Never includes the token.
 */
const toError = (res, body) => {
  const detail = (body && body.message) || "";

  if (res.status === 401) {
    return new GithubApiError("BAD_TOKEN", 401, "GitHub rejected the token.");
  }

  if (res.status === 403 || res.status === 429) {
    if (readHeader(res, "x-ratelimit-remaining") === "0") {
      const reset = readHeader(res, "x-ratelimit-reset");
      return new GithubApiError(
        "RATE_LIMITED",
        res.status,
        reset
          ? `GitHub rate limit reached. Resets at ${new Date(Number(reset) * 1000).toISOString()}.`
          : "GitHub rate limit reached."
      );
    }
    return new GithubApiError(
      "FORBIDDEN",
      res.status,
      detail || "GitHub refused the request. The token may lack write access."
    );
  }

  if (res.status === 404) {
    // GitHub returns 404 for a private repo the token cannot see, so never
    // claim the repository does not exist.
    return new GithubApiError(
      "NOT_FOUND",
      404,
      "Not found on GitHub, or the token has no access to it."
    );
  }

  if (res.status === 422) {
    if (/already exists/i.test(detail)) {
      return new GithubApiError("REF_EXISTS", 422, "That branch already exists.");
    }
    return new GithubApiError("INVALID", 422, detail || "GitHub rejected the request as invalid.");
  }

  return new GithubApiError(
    "UNKNOWN",
    res.status,
    detail || `Unexpected response from GitHub (${res.status}).`
  );
};

/**
 * Belt and braces: GitHub's own error text is passed through to callers, so
 * scrub the token out of it before it is baked into an Error (and its stack,
 * which is captured at construction and cannot be edited afterwards).
 */
const redactToken = (body, token) => {
  if (!body || typeof body.message !== "string" || !token) return body;
  if (!body.message.includes(token)) return body;
  return { ...body, message: body.message.split(token).join("[redacted]") };
};

const request = async (path, options) => {
  const opts = options || {};
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sprintboard-backend", // GitHub rejects requests with no UA
    Authorization: `Bearer ${opts.token}`,
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_BASE()}${path}`, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new GithubApiError(
      timedOut ? "TIMEOUT" : "NETWORK",
      0,
      timedOut ? "GitHub did not respond in time." : "Could not reach GitHub."
    );
  }

  const body = await readBody(res);
  if (!res.ok) throw toError(res, redactToken(body, opts.token));
  return opts.withHeaders ? { body: body, res: res } : body;
};

// A branch name may contain "/", which stays literal inside the ref path, so
// encode each segment individually rather than the whole string.
const encodeRefPath = (branch) =>
  String(branch)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

/**
 * Resolves a branch to the commit sha it points at.
 * @return {Promise<string>}
 */
const getRefSha = async ({ token, owner, repo, branch }) => {
  const json = await request(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeRefPath(branch)}`,
    { token: token }
  );
  if (!json || !json.object || !json.object.sha) {
    throw new GithubApiError("UNKNOWN", 200, "GitHub returned a ref with no commit sha.");
  }
  return json.object.sha;
};

/**
 * Creates a branch at the given sha. A branch that already exists is treated as
 * success with created:false, so re-running is harmless.
 * @return {Promise<{created: boolean, ref: string}>}
 */
const createBranch = async ({ token, owner, repo, branch, sha }) => {
  try {
    const json = await request(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs`,
      { token: token, method: "POST", body: { ref: `refs/heads/${branch}`, sha: sha } }
    );
    return { created: true, ref: (json && json.ref) || `refs/heads/${branch}` };
  } catch (err) {
    if (err instanceof GithubApiError && err.code === "REF_EXISTS") {
      return { created: false, ref: `refs/heads/${branch}` };
    }
    throw err;
  }
};

/**
 * Confirms a token works and reports who it belongs to. Used at connect time so
 * a bad token is caught then rather than when someone drags a card.
 * @return {Promise<{login: string, scopes: string[]}>}
 */
const validateToken = async (token) => {
  const { body, res } = await request("/user", { token: token, withHeaders: true });
  // Only classic PATs report scopes; fine-grained tokens send nothing, which is
  // the safer kind and shows up here as an empty list.
  const raw = readHeader(res, "x-oauth-scopes");
  return {
    login: body && body.login,
    scopes: raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
};

module.exports = {
  GithubApiError,
  getRefSha,
  createBranch,
  validateToken,
};
