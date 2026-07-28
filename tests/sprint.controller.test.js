jest.mock("../app/models", () => ({
  sprint: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
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
// in one call). This file mocks the DB, so these check what was PASSED to
// Sprint.bulkCreate rather than querying the DB afterward, since a mocked
// findAll has no way to "see" what a separate mocked bulkCreate produced.
describe("sprint.createRecurring", () => {
  it("calls bulkCreate with sequential names and back-to-back dates", async () => {
    const res = mockRes();
    db.sprint.bulkCreate.mockResolvedValue([]);

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 14,
          count: 3,
          projectId: 5,
        },
      },
      res
    );

    expect(db.sprint.bulkCreate).toHaveBeenCalledWith([
      { name: "Sprint 1", startDate: "2026-08-01", endDate: "2026-08-14", isActive: true, projectId: 5 },
      { name: "Sprint 2", startDate: "2026-08-15", endDate: "2026-08-28", isActive: true, projectId: 5 },
      { name: "Sprint 3", startDate: "2026-08-29", endDate: "2026-09-11", isActive: true, projectId: 5 },
    ]);
  });

  it("marks every generated sprint as active", async () => {
    const res = mockRes();
    db.sprint.bulkCreate.mockResolvedValue([]);

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 7,
          count: 2,
          projectId: 5,
        },
      },
      res
    );

    const sprintsPassedIn = db.sprint.bulkCreate.mock.calls[0][0];
    expect(sprintsPassedIn).toHaveLength(2);
    sprintsPassedIn.forEach((sprint) => {
      expect(sprint.isActive).toBe(true);
    });
  });

  it("returns 400 when a required field is missing, without calling bulkCreate", async () => {
    const res = mockRes();

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 14,
          // count intentionally omitted
          projectId: 5,
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.sprint.bulkCreate).not.toHaveBeenCalled();
  });

  it("sends back whatever bulkCreate resolves with", async () => {
    const res = mockRes();
    const fakeCreated = [
      { id: 1, name: "Sprint 1", projectId: 5 },
      { id: 2, name: "Sprint 2", projectId: 5 },
    ];
    db.sprint.bulkCreate.mockResolvedValue(fakeCreated);

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 14,
          count: 2,
          projectId: 5,
        },
      },
      res
    );

    expect(res.send).toHaveBeenCalledWith(fakeCreated);
  });

  it("returns 500 when bulkCreate fails", async () => {
    const res = mockRes();
    db.sprint.bulkCreate.mockRejectedValue(new Error("db down"));

    await sprintController.createRecurring(
      {
        body: {
          name: "Sprint",
          startDate: "2026-08-01",
          lengthDays: 14,
          count: 2,
          projectId: 5,
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });
});