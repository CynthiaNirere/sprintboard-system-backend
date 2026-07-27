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

    expect(db.sprint.findAll).toHaveBeenCalledWith({
      where: { projectId: 5 },
      order: [["startDate", "ASC"]],
    });
    expect(res.send).toHaveBeenCalledWith(fakeSprints);
  });
});