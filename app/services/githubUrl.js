/**
 * Pulls the owner and repository name out of a github_repositories.url value.
 * The url column is free text, so anything unrecognised returns null and the
 * caller reports REPO_URL_UNPARSEABLE rather than guessing.
 *
 * Handles:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/
 *   git@github.com:owner/repo.git
 *   owner/repo
 *
 * @return {{owner: string, repoName: string} | null}
 */
const parseRepoUrl = (url) => {
  if (typeof url !== "string") return null;

  let trimmed = url.trim();
  if (trimmed === "") return null;

  // git@github.com:owner/repo.git -> owner/repo.git
  const scpMatch = /^[^@]+@[^:]+:(.+)$/.exec(trimmed);
  if (scpMatch) {
    trimmed = scpMatch[1];
  } else {
    trimmed = trimmed
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "") // strip scheme
      .replace(/^[^/]*github[^/]*\//i, "");    // strip the github.com host
  }

  trimmed = trimmed.replace(/\.git$/i, "").replace(/\/+$/, "");

  const parts = trimmed.split("/").filter((part) => part !== "");
  if (parts.length < 2) return null;

  // Take the last two segments so a trailing /tree/main or /pull/3 is ignored.
  const owner = parts[0];
  const repoName = parts[1];

  // GitHub allows letters, digits, dot, dash and underscore in both names.
  const valid = /^[A-Za-z0-9._-]+$/;
  if (!valid.test(owner) || !valid.test(repoName)) return null;

  return { owner: owner, repoName: repoName };
};

module.exports = { parseRepoUrl };
