const isProjectAdmin = require("../app/middleware/isProjectAdmin");
const db = require("../app/models");

const User = db.user;
const ProjectMember = db.projectMember;

jest.mock("../app/models", () => ({
  user: {
    findByPk: jest.fn(),
  },
  projectMember: {
    findOne: jest.fn(),
  },
}));

describe("isProjectAdmin middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      userId: 1,
      params: { id: "5" },
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });


  it("calls next() when the user is a global Admin, without checking project membership", async () => {
    User.findByPk.mockResolvedValue({ id: 1, globalRole: "ADMIN" });

    await isProjectAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(ProjectMember.findOne).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });


  it("calls next() when the user is a PROJECT_ADMIN on this project", async () => {
    User.findByPk.mockResolvedValue({ id: 1, globalRole: "USER" });
    ProjectMember.findOne.mockResolvedValue({
      projectId: "5",
      userId: 1,
      projectRole: "PROJECT_ADMIN",
    });

    await isProjectAdmin(req, res, next);

    expect(ProjectMember.findOne).toHaveBeenCalledWith({
      where: {
        projectId: "5",
        userId: 1,
        projectRole: "PROJECT_ADMIN",
      },
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });


  it("returns 403 when the user is neither an Admin nor a Project Admin on this project", async () => {
    User.findByPk.mockResolvedValue({ id: 1, globalRole: "USER" });
    ProjectMember.findOne.mockResolvedValue(null);

    await isProjectAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith({
      message: "Access denied. Admins or Project Admins only.",
    });
  });


  it("returns 403 when the user is a DEVELOPER on this project (not PROJECT_ADMIN)", async () => {
    User.findByPk.mockResolvedValue({ id: 1, globalRole: "USER" });
    // findOne's own where clause filters on projectRole: "PROJECT_ADMIN", so a
    // DEVELOPER row simply won't match and findOne resolves null here too.
    ProjectMember.findOne.mockResolvedValue(null);

    await isProjectAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });


  it("falls through to the project-membership check when the user record itself isn't found", async () => {
    User.findByPk.mockResolvedValue(null);
    ProjectMember.findOne.mockResolvedValue({
      projectId: "5",
      userId: 1,
      projectRole: "PROJECT_ADMIN",
    });

    await isProjectAdmin(req, res, next);

    // Doesn't throw on `user.globalRole` when user is null/undefined — falls
    // through to the membership check instead, which still passes here.
    expect(next).toHaveBeenCalled();
  });


  it("returns 500 when looking up the user throws", async () => {
    User.findByPk.mockRejectedValue(new Error("db down"));

    await isProjectAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });


  it("returns 500 when the project-membership lookup throws", async () => {
    User.findByPk.mockResolvedValue({ id: 1, globalRole: "USER" });
    ProjectMember.findOne.mockRejectedValue(new Error("db down"));

    await isProjectAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
