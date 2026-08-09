const automation = require("../app/services/boardStatusAutomation");
const db = require("../app/models");

const {
  AUTOMATION_FIELD,
  AutomationEvents,
  isAutomationAvailable,
  getStatusEvent,
  findStatusWithEvent,
} = automation;

jest.mock("../app/models", () => ({
  boardStatus: {
    findOne: jest.fn(),
    rawAttributes: {},
  },
}));

describe("boardStatusAutomation", () => {

  beforeEach(() => {
    db.boardStatus.rawAttributes = {};
    jest.clearAllMocks();
  });


  it("uses the agreed column name", () => {
    expect(AUTOMATION_FIELD).toBe("githubEvent");
    expect(AutomationEvents.CREATE_BRANCH).toBe("CREATE_BRANCH");
    expect(AutomationEvents.PR_OPENED).toBe("PR_OPENED");
    expect(AutomationEvents.PR_MERGED).toBe("PR_MERGED");
  });


  it("resolves the lowercase values actually stored in the database", () => {
    // The board-status work writes lowercase snake_case.
    expect(getStatusEvent({ githubEvent: "create_branch" })).toBe("CREATE_BRANCH");
    expect(getStatusEvent({ githubEvent: "pr_opened" })).toBe("PR_OPENED");
    expect(getStatusEvent({ githubEvent: "pr_merged" })).toBe("PR_MERGED");
  });


  it("keeps the three events distinct", () => {
    expect(getStatusEvent({ githubEvent: "create_branch" })).not.toBe("PR_OPENED");
    expect(getStatusEvent({ githubEvent: "pr_opened" })).not.toBe("PR_MERGED");
  });


  it("ignores the leftover branch_created value", () => {
    expect(getStatusEvent({ githubEvent: "branch_created" })).toBeNull();
  });


  describe("before the board status column exists", () => {

    it("reports the automation as unavailable", () => {
      expect(isAutomationAvailable()).toBe(false);
    });


    it("returns null from findStatusWithEvent without querying", async () => {
      const result = await findStatusWithEvent(1, "CREATE_BRANCH");

      expect(result).toBeNull();
      // Querying a column that does not exist would throw ER_BAD_FIELD_ERROR.
      expect(db.boardStatus.findOne).not.toHaveBeenCalled();
    });

  });


  describe("once the column exists", () => {

    beforeEach(() => {
      db.boardStatus.rawAttributes = { githubEvent: {} };
    });


    it("reports the automation as available", () => {
      expect(isAutomationAvailable()).toBe(true);
    });


    it("queries for the project's status carrying the event", async () => {
      const status = { id: 2, name: "In Progress" };
      db.boardStatus.findOne.mockResolvedValue(status);

      const result = await findStatusWithEvent(7, "CREATE_BRANCH");

      expect(db.boardStatus.findOne).toHaveBeenCalledWith({
        where: { projectId: 7, githubEvent: "CREATE_BRANCH" },
        order: [["columnOrder", "ASC"]],
      });
      expect(result).toBe(status);
    });


    it("ignores an event it does not recognise", async () => {
      const result = await findStatusWithEvent(7, "DELETE_EVERYTHING");

      expect(result).toBeNull();
      expect(db.boardStatus.findOne).not.toHaveBeenCalled();
    });


    it.each([
      ["PR_OPENED"],
      ["PR_MERGED"],
    ])("looks up the status carrying %s", async (event) => {
      db.boardStatus.findOne.mockResolvedValue({ id: 4, name: "Done" });

      const result = await findStatusWithEvent(7, event);

      expect(db.boardStatus.findOne).toHaveBeenCalledWith({
        where: { projectId: 7, githubEvent: event },
        order: [["columnOrder", "ASC"]],
      });
      expect(result).toEqual({ id: 4, name: "Done" });
    });

  });


  describe("getStatusEvent", () => {

    it("reads the field off a plain object", () => {
      expect(getStatusEvent({ githubEvent: "CREATE_BRANCH" })).toBe("CREATE_BRANCH");
    });


    it("reads the field off a Sequelize instance", () => {
      const instance = { get: (key) => (key === "githubEvent" ? "CREATE_BRANCH" : null) };

      expect(getStatusEvent(instance)).toBe("CREATE_BRANCH");
    });


    it("normalises casing and whitespace", () => {
      expect(getStatusEvent({ githubEvent: " create_branch " })).toBe("CREATE_BRANCH");
    });


    it("returns null for a null status", () => {
      expect(getStatusEvent(null)).toBeNull();
      expect(getStatusEvent(undefined)).toBeNull();
    });


    it("returns null when the field is unset", () => {
      expect(getStatusEvent({ githubEvent: null })).toBeNull();
      expect(getStatusEvent({ name: "Done" })).toBeNull();
    });


    it("returns null for a value it does not recognise", () => {
      expect(getStatusEvent({ githubEvent: "SOMETHING_ELSE" })).toBeNull();
    });

  });

});
