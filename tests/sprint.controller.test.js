jest.mock("../app/models", () => ({
  sprint: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Sequelize: { Op: {} },
}));

const db = require("../app/models");
const sprintController = require("../app/controllers/sprint.controller");

/**
 * Builds a fake Express res object.
 * Controllers finish by calling res.send(data) or res.status(500)
 */
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// resets their call history rather than reseeding real tables.
beforeEach(() => {
  jest.clearAllMocks();
});

describe("sprint.create", () => {
  it("saves a sprint to the database", async () => {
    const res = mockRes();
    const fakeSprint = {
      id: 1,
      name: "Sprint 1",
      startDate: "2026-08-01",
      endDate: "2026-08-14",
      isActive: true,
      projectId: 5,
    };
    db.sprint.create.mockResolvedValue(fakeSprint);

    await sprintController.create(
      {
        body: {
          name: "Sprint 1",
          startDate: "2026-08-01",
          endDate: "2026-08-14",
          projectId: 5,
        },
      },
      res
    );

    expect(db.sprint.create).toHaveBeenCalledWith({
      name: "Sprint 1",
      startDate: "2026-08-01",
      endDate: "2026-08-14",
      isActive: true,
      projectId: 5,
    });
    expect(res.send).toHaveBeenCalledWith(fakeSprint);
  });

  it("throws when the name is missing", async () => {
    const res = mockRes();

    //  the returned promise REJECTS instead of sending a response.
    await expect(
      sprintController.create(
        {
          body: {
            startDate: "2026-08-01",
            endDate: "2026-08-14",
            projectId: 5,
          },
        },
        res
      )
    ).rejects.toThrow("Name cannot be empty");

    expect(db.sprint.create).not.toHaveBeenCalled();
  });
});

describe("sprint.findAll", () => {
  it("returns the sprints for a project", async () => {
    const fakeSprints = [
      { id: 1, name: "Sprint A", projectId: 5, startDate: "2026-08-01" },
    ];
    db.sprint.findAll.mockResolvedValue(fakeSprints);

    const res = mockRes();
    await sprintController.findAll({ query: { projectId: 5 } }, res);

    expect(db.sprint.findAll).toHaveBeenCalledWith(
  expect.objectContaining({
    where: { projectId: 5 },
    order: [["startDate", "ASC"]],
  })
);
    expect(res.send).toHaveBeenCalledWith(fakeSprints);
  });
});

// createRecurring bulk-generates sequential sprints (e.g. six 2-week sprints
// in one call). Verified against the REAL database, same as sprint.create
// above, since bulkCreate's own behavior (date sequencing, isActive default)
// is exactly the business logic worth proving.
describe("sprint.createRecurring", () => {
  it("creates the requested number of sprints with sequential names and back-to-back dates", async () => {
    const res = mockRes();

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 14,
          count: 3,
          projectId: project.id,
        },
      },
      res
    );

    const found = await db.sprint.findAll({
      where: { projectId: project.id },
      order: [["startDate", "ASC"]],
    });

    expect(found).toHaveLength(3);

    expect(found[0].name).toBe("Sprint 1");
    expect(found[0].startDate.toISOString()).toContain("2026-08-01");
    expect(found[0].endDate.toISOString()).toContain("2026-08-14");

    expect(found[1].name).toBe("Sprint 2");
    expect(found[1].startDate.toISOString()).toContain("2026-08-15");
    expect(found[1].endDate.toISOString()).toContain("2026-08-28");

    // Sprint 3 starts the day immediately after Sprint 2 ends — no gap, no overlap.
    expect(found[2].name).toBe("Sprint 3");
    expect(found[2].startDate.toISOString()).toContain("2026-08-29");
    expect(found[2].endDate.toISOString()).toContain("2026-09-11");
  });

  it("marks every generated sprint as active", async () => {
    const res = mockRes();

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 7,
          count: 2,
          projectId: project.id,
        },
      },
      res
    );

    const found = await db.sprint.findAll({ where: { projectId: project.id } });
    expect(found).toHaveLength(2);
    found.forEach((sprint) => {
      expect(sprint.isActive).toBe(true);
    });
  });

  it("returns 400 when a required field is missing", async () => {
    const res = mockRes();

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 14,
          // count intentionally omitted
          projectId: project.id,
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);

    const found = await db.sprint.findAll({ where: { projectId: project.id } });
    expect(found).toHaveLength(0);
  });

  it("sends the created sprints back in the response", async () => {
    const res = mockRes();

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 14,
          count: 2,
          projectId: project.id,
        },
      },
      res
    );

    const data = res.send.mock.calls[0][0];
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Sprint 1");
    expect(data[1].name).toBe("Sprint 2");
  });
});