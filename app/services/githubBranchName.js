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

  return slug === ""
    ? `${prefix}/ticket-${id}`
    : `${prefix}/ticket-${id}-${slug}`;
};

module.exports = { buildBranchName, TYPE_PREFIX };
