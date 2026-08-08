// Fixed branch naming convention. Not configurable by design — every project
// gets the same shape so branches are predictable across the workspace.
//
//   feature/ticket-42-refactor-database-seed-script
//   bugfix/ticket-8-users-cannot-login

const TYPE_PREFIX = {
  FEATURE: "feature",
  ENHANCEMENT: "enhancement",
  BUG: "bugfix",
};

const MAX_SLUG_LENGTH = 50;

/**
 * Builds the branch name for a ticket. The result is always a legal git ref:
 * no "..", no ~^:?*[ characters, no leading or trailing "-" or "/", and no
 * ".lock" suffix.
 */
const buildBranchName = (ticket) => {
  const prefix = TYPE_PREFIX[ticket && ticket.type] || "feature";

  const slug = String((ticket && ticket.title) || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, "");

  const id = ticket && ticket.id;

  // Purely generative — honouring a user-supplied githubBranchName is the
  // automation's job, since only it can normalise the input and report an
  // invalid one back to the caller.
  return slug === ""
    ? `${prefix}/ticket-${id}`
    : `${prefix}/${slug}`;
};

/**
 * Tidies a branch name a user typed, without reshaping it — the whole point of
 * supplying one is to get that exact name.
 *
 * Returns "" when there is nothing usable, which callers read as "fall back to
 * the generated convention".
 */
const normaliseBranchName = (raw) => {
  if (typeof raw !== "string") return "";

  return raw
    .trim()
    .replace(/^refs\/heads\//, "")
    .replace(/\/{2,}/g, "/")
    .trim();
};

/**
 * Checks a branch name against git's ref rules (see git check-ref-format), so a
 * typo is reported as INVALID_BRANCH_NAME rather than spent on an API call that
 * GitHub would reject with a 422.
 *
 * Every name buildBranchName() produces satisfies these by construction.
 */
const isValidBranchName = (name) => {
  if (typeof name !== "string" || name === "") return false;

  // Control characters, DEL, and the characters git reserves.
  if (/[\x00-\x1F\x7F ~^:?*[\\]/.test(name)) return false;

  if (name.includes("..")) return false;
  if (name.includes("@{")) return false;
  if (name === "@") return false;

  if (name.startsWith("/") || name.endsWith("/")) return false;
  if (name.includes("//")) return false;

  if (name.endsWith(".")) return false;
  if (name.endsWith(".lock")) return false;

  // No path component may start with a dot or end with .lock.
  const components = name.split("/");
  if (components.some((part) => part === "" || part.startsWith(".") || part.endsWith(".lock"))) {
    return false;
  }

  return true;
};

module.exports = {
  buildBranchName,
  normaliseBranchName,
  isValidBranchName,
  TYPE_PREFIX,
};
