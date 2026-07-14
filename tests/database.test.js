const db = require("../app/models");

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});
// test 1 to see if table exist in database
describe("database schema", () => {
  it("creates all tables defined in the ERD", async () => {
    const tables = await db.sequelize.getQueryInterface().showAllTables();

    const expected = [
      "users",
      "projects",
      "project_members",
      "sprints",
      "board_statuses",
      "tickets",
      "tests",
      "test_histories",
      "ticket_histories",
      "retrospectives",
      "retro_items",
      "user_activity_logs",
      "github_repositories",
      "comments",
      "attachments",
      "sessions",
    ];

    expected.forEach((table) => {
      expect(tables).toContain(table);
    });
  });
// we made changed to database, so we need to confirm it worked for the comments 
  it("replaced ticket_comments with comments", async () => {
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    expect(tables).toContain("comments");
    expect(tables).not.toContain("ticket_comments");
  });
// we changed the oldvalue as well to now be messages on our erd
  it("ticket_histories uses message instead of oldValue/newValue", async () => {
    const cols = await db.sequelize.getQueryInterface().describeTable("ticket_histories");
    expect(cols).toHaveProperty("message");
    expect(cols).not.toHaveProperty("oldValue");
    expect(cols).not.toHaveProperty("newValue");
  });
// verified what columns exist in sprint table
  it("sprints has the ERD columns", async () => {
    const cols = await db.sequelize.getQueryInterface().describeTable("sprints");
    expect(cols).toHaveProperty("name");
    expect(cols).toHaveProperty("startDate");
    expect(cols).toHaveProperty("endDate");
    expect(cols).toHaveProperty("isActive");
    expect(cols).toHaveProperty("projectId");
  });
// checked for some foreign key
  it("project_members has both foreign keys", async () => {
    const cols = await db.sequelize.getQueryInterface().describeTable("project_members");
    expect(cols).toHaveProperty("userId");
    expect(cols).toHaveProperty("projectId");
    expect(cols).toHaveProperty("projectRole");
  });
// seeing if an error is thrown when creating a project with id 99999
  it("enforces the sprint-project foreign key", async () => {
    await expect(
      db.sprint.create({
        name: "Orphan Sprint",
        startDate: "2026-08-01",
        endDate: "2026-08-14",
        projectId: 99999,
      })
    ).rejects.toThrow();
  });
});