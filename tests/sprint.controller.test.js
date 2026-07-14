const db = require("../app/models");
const sprintController = require("../app/controllers/sprint.controller");

// variables will be used by every test.
let user;
let project;

/**
 * Builds a fake Express res object.
 * Controllers finish by calling res.send(data) or res.status(500)
 * Since we call controller functions directly (no Express server), we must
 * supply our own res 
 */
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Runs once before and it drop & recreate every table from the models
beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

// Runs before every test: wipe rows and reseed a known state
beforeEach(async () => {
  // Delete children before parents, or MySQL foreign keys will block us
  await db.sprint.destroy({ where: {} });
  await db.project.destroy({ where: {} });
  await db.user.destroy({ where: {} });

  // projects.createdBy is NOT NULL, so a user must exist before any project.
  // The password/salt are fake Buffers
  user = await db.user.create({
    username: "testadmin",
    firstName: "Test",
    lastName: "Admin",
    email: "admin@test.com",
    password: Buffer.from("fakehash"),
    salt: Buffer.from("fakesalt"),
    globalRole: "ADMIN",
  });

  project = await db.project.create({
    name: "SprintBoard",
    description: "Test project",
    createdBy: user.id,
  });
});

// Runs ONCE after and it closes the MySQL connection pool.
afterAll(async () => {
  await db.sequelize.close();
});

describe("sprint.create", () => {
  it("saves a sprint to the database", async () => {
    const res = mockRes();

    // Call the controller directly with a hand-built req
    await sprintController.create(
      {
        body: {
          name: "Sprint 1",
          startDate: "2026-08-01",
          endDate: "2026-08-14",
          projectId: project.id, // use the seeded id , never hardcode ids,
        },                       
      },
      res
    );

    // Verify against the REAL database, not just the controller's response.
    const found = await db.sprint.findOne({ where: { name: "Sprint 1" } });
    expect(found).not.toBeNull();

    // startDate is DATETIME in the model, so Sequelize returns a Date object,    
    expect(found.startDate.toISOString()).toContain("2026-08-01");
  });

  it("throws when the name is missing", async () => {
    const res = mockRes();

    // The controller's validation does throw error with NO try/catch around
    // it, so the returned promise REJECTS instead of sending a response.
    await expect(
      sprintController.create(
        {
          body: {
            // name field kept empty
            startDate: "2026-08-01",
            endDate: "2026-08-14",
            projectId: project.id,
          },
        },
        res
      )
    ).rejects.toThrow("Name cannot be empty");
  });
});
// should verify that findAll returns all sprints belonging to a project.
describe("sprint.findAll", () => {
  it("returns the sprints for a project", async () => {
    // insert a sprint directly via the model
    await db.sprint.create({
      name: "Sprint A",
      startDate: "2026-08-01",
      endDate: "2026-08-14",
      projectId: project.id,
    });

    //  findAll reads req.query (the ?projectId= filter), not req.body.
    const res = mockRes();
    await sprintController.findAll({ query: { projectId: project.id } }, res);

    // findAll's job is the response, so check what was sent.
    const data = res.send.mock.calls[0][0];
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Sprint A");
  });
});