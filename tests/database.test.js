const db = require("../app/models");

describe("model definitions", () => {
  it("defines a model for every table in the ERD", () => {
    const expectedTables = {
      user: "users",
      project: "projects",
      projectMember: "project_members",
      sprint: "sprints",
      boardStatus: "board_statuses",
      ticket: "tickets",
      test: "tests",
      testHistory: "test_histories",
      ticketHistory: "ticket_histories",
      retrospective: "retrospectives",
      retroItem: "retro_items",
      userActivityLog: "user_activity_logs",
      githubRepository: "github_repositories",
      comment: "comments",
      attachment: "attachments",
      session: "sessions",
    };

    Object.entries(expectedTables).forEach(([modelKey, tableName]) => {
      expect(db[modelKey]).toBeDefined();
      expect(db[modelKey].getTableName()).toBe(tableName);
    });
  });

  it("uses a comment model mapped to 'comments' (not the old ticket_comments)", () => {
    expect(db.comment.getTableName()).toBe("comments");
  });

  it("ticketHistory uses 'message' instead of oldValue/newValue", () => {
    const attrs = db.ticketHistory.rawAttributes;
    expect(attrs).toHaveProperty("message");
    expect(attrs).not.toHaveProperty("oldValue");
    expect(attrs).not.toHaveProperty("newValue");
  });

  it("sprint has the ERD columns", () => {
    const attrs = db.sprint.rawAttributes;
    expect(attrs).toHaveProperty("name");
    expect(attrs).toHaveProperty("startDate");
    expect(attrs).toHaveProperty("endDate");
    expect(attrs).toHaveProperty("isActive");
    expect(attrs).toHaveProperty("projectId");
  });

  it("projectMember has both foreign keys", () => {
    const attrs = db.projectMember.rawAttributes;
    expect(attrs).toHaveProperty("userId");
    expect(attrs).toHaveProperty("projectId");
    expect(attrs).toHaveProperty("projectRole");
  });

  it("sprint requires projectId (matches the sprint-project foreign key)", () => {
    const attrs = db.sprint.rawAttributes;
    expect(attrs.projectId.allowNull).toBe(false);
  });
});