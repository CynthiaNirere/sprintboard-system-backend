// The contract with the board-status automation work.
//
// This is the ONLY file that names the column. If that work lands with a
// different attribute name or different values, this file is the only thing
// that changes.
//
// Until the column exists, isAutomationAvailable() reports false and every
// caller degrades to "no automation configured" — reading a column that is not
// there would otherwise throw ER_BAD_FIELD_ERROR.

const db = require("../models");

const AUTOMATION_FIELD = "githubEvent";

const AutomationEvents = {
  // Outbound: act on GitHub when a ticket lands in this column.
  CREATE_BRANCH: "CREATE_BRANCH",
  CREATE_PR: "CREATE_PR",
  // Inbound: move a ticket into this column when its PR opens / merges.
  PR_OPENED: "PR_OPENED",
  PR_MERGED: "PR_MERGED",
};

const VALID_EVENTS = new Set(Object.values(AutomationEvents));

/**
 * True once the board_statuses column exists on the model.
 */
const isAutomationAvailable = () =>
  Boolean(
    db.boardStatus &&
      db.boardStatus.rawAttributes &&
      db.boardStatus.rawAttributes[AUTOMATION_FIELD]
  );

/**
 * Reads the automation event off a board status. Accepts either a Sequelize
 * instance or a plain object. Anything unrecognised returns null, so an
 * unexpected value can never trigger automation by accident.
 * @return {string | null}
 */
const getStatusEvent = (boardStatus) => {
  if (!boardStatus) return null;

  const raw =
    typeof boardStatus.get === "function"
      ? boardStatus.get(AUTOMATION_FIELD)
      : boardStatus[AUTOMATION_FIELD];

  if (!raw) return null;

  const normalised = String(raw).trim().toUpperCase();
  return VALID_EVENTS.has(normalised) ? normalised : null;
};

/**
 * Finds the board status for a project carrying the given event, or null.
 * Ordered by columnOrder so the result is deterministic if two columns end up
 * tagged with the same event.
 */
const findStatusWithEvent = async (projectId, event) => {
  if (!isAutomationAvailable()) return null;
  if (!VALID_EVENTS.has(event)) return null;

  return db.boardStatus.findOne({
    where: { projectId: projectId, [AUTOMATION_FIELD]: event },
    order: [["columnOrder", "ASC"]],
  });
};

module.exports = {
  AUTOMATION_FIELD,
  AutomationEvents,
  isAutomationAvailable,
  getStatusEvent,
  findStatusWithEvent,
};
