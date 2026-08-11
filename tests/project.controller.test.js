const projectController = require("../app/controllers/project.controller");
const db = require("../app/models");

const Project = db.project;
const ProjectMember = db.projectMember;
const User = db.user;

jest.mock("../app/models", () => ({
  project: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  projectMember: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  user: {
    findByPk: jest.fn(),
  },
  sprint: {},
  ticket: {},
  boardStatus: {
    create: jest.fn(),
  },
  githubRepository: {},
  Sequelize: {
    Op: {
      like: Symbol("like"),
    },
  },
}));

describe("Project Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      userId: 1,
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });


  describe("create", () => {

    it("should return 400 if name is missing", async () => {
      req.body = {};

      await projectController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(400);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Name cannot be empty for project!",
        });
    });


    // Confirmed against the real controller: create() does auto-create a
    // default "No Status" board status for the new project.
    it("should create a project and its default board status", async () => {
      const requestBody = {
        name: "Website Project",
        description: "New website",
      };

      const createdProject = {
        id: 1,
        ...requestBody,
        createdBy: 1,
      };

      req.body = requestBody;
      req.userId = 1;

      Project.create.mockResolvedValue(createdProject);
      db.boardStatus.create.mockResolvedValue({
        id: 1,
        name: "No Status",
        columnOrder: 1,
        projectId: 1,
      });

      await projectController.create(req, res);

      expect(Project.create)
        .toHaveBeenCalledWith({
          name: "Website Project",
          description: "New website",
          createdBy: 1,
        });

      expect(db.boardStatus.create)
        .toHaveBeenCalledWith({
          name: "No Status",
          columnOrder: 1,
          projectId: 1,
        });

      expect(res.send)
        .toHaveBeenCalledWith(createdProject);
    });


    it("should handle create errors", async () => {
      Project.create.mockRejectedValue(
        new Error("Database error")
      );

      req.body = {
        name: "Project",
      };

      await projectController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findAll", () => {

    it("should return all projects", async () => {
      const projects = [
        {
          id: 1,
          name: "Project",
        },
      ];

      Project.findAll.mockResolvedValue(projects);

      await projectController.findAll(req, res);

      expect(Project.findAll)
        .toHaveBeenCalled();

      expect(res.send)
        .toHaveBeenCalledWith(projects);
    });


    it("should filter projects by name", async () => {
      req.query.name = "Web";

      Project.findAll.mockResolvedValue([]);

      await projectController.findAll(req, res);

      expect(Project.findAll)
        .toHaveBeenCalled();
    });


    it("should handle findAll errors", async () => {
      Project.findAll.mockRejectedValue(
        new Error("error")
      );

      await projectController.findAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findOne", () => {

    it("should return project by id", async () => {
      req.params.id = 1;

      const project = {
        id: 1,
        name: "Project",
      };

      Project.findByPk.mockResolvedValue(project);

      await projectController.findOne(req, res);

      expect(Project.findByPk)
        .toHaveBeenCalledWith(
          1,
          expect.any(Object)
        );

      expect(res.send)
        .toHaveBeenCalledWith(project);
    });


    it("should handle findOne errors", async () => {
      req.params.id = 1;

      Project.findByPk.mockRejectedValue(
        new Error("error")
      );

      await projectController.findOne(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findUserProjects", () => {

    it("should return projects for a user", async () => {
      req.params.userId = 10;

      const projects = [
        {
          id: 1,
          name: "Project",
        },
      ];

      Project.findAll.mockResolvedValue(projects);

      await projectController.findUserProjects(req, res);

      expect(Project.findAll)
        .toHaveBeenCalled();

      expect(res.status)
        .toHaveBeenCalledWith(200);

      expect(res.send)
        .toHaveBeenCalledWith(projects);
    });


    it("should return 404 when no projects found", async () => {
      req.params.userId = 10;

      Project.findAll.mockResolvedValue(null);

      await projectController.findUserProjects(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(404);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Project(s) not found.",
        });
    });


    it("should handle findUserProjects errors", async () => {
      Project.findAll.mockRejectedValue(
        new Error("error")
      );

      await projectController.findUserProjects(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findProjectMembers", () => {

    it("should return 200 with the mapped users array", async () => {
      req.params.id = 1;

      const fakeUsers = [
        { id: 7, firstName: "Sofia", lastName: "Chen", globalRole: "USER", projectRole: "DEVELOPER" },
      ];

      Project.findByPk.mockResolvedValue({ users: fakeUsers });

      await projectController.findProjectMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(fakeUsers);
    });


    it("should return 404 when the project doesn't exist", async () => {
      req.params.id = 999;

      Project.findByPk.mockResolvedValue(null);

      await projectController.findProjectMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });


    it("should handle errors", async () => {
      req.params.id = 1;

      Project.findByPk.mockRejectedValue(new Error("db down"));

      await projectController.findProjectMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });



  describe("addProjectMember", () => {

    it("should return 400 when userId is missing", async () => {
      req.params.projectId = 1;
      req.body = { projectRole: "DEVELOPER" };

      await projectController.addProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should return 400 when projectRole is missing", async () => {
      req.params.projectId = 1;
      req.body = { userId: 7 };

      await projectController.addProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should return 400 when the user is already a member of this project", async () => {
      req.params.projectId = 1;
      req.body = { userId: 7, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 7, projectRole: "DEVELOPER" });

      await projectController.addProjectMember(req, res);

      expect(ProjectMember.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "This user is already a member of this project.",
      });
    });


    it("should create the member and return 201 when not already a member", async () => {
      req.params.projectId = 1;
      req.body = { userId: 7, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue(null);
      ProjectMember.create.mockResolvedValue({ projectId: 1, userId: 7, projectRole: "DEVELOPER" });
      Project.findByPk.mockResolvedValue({ id: 1, name: "Website Project" });
      User.findByPk.mockResolvedValue({ id: 7, firstName: "Sofia", lastName: "Chen" });

      await projectController.addProjectMember(req, res);

      expect(ProjectMember.create).toHaveBeenCalledWith({
        projectId: 1,
        userId: 7,
        projectRole: "DEVELOPER",
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });


    it("should return 500 when create fails", async () => {
      req.params.projectId = 1;
      req.body = { userId: 7, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue(null);
      ProjectMember.create.mockRejectedValue(new Error("constraint violation"));

      await projectController.addProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });



  describe("updateProjectMember", () => {

    it("should return 400 when userId or projectRole is missing", async () => {
      req.params.id = 1;
      req.body = { userId: 7 };

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should return 404 when the target member doesn't exist", async () => {
      req.params.id = 1;
      req.body = { userId: 999, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue(null);

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });


    it("should return 403 when a non-admin tries to update their own role", async () => {
      req.userId = 7;
      req.params.id = 1;
      req.body = { userId: 7, projectRole: "PROJECT_ADMIN" };

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 7, projectRole: "DEVELOPER" });
      User.findByPk.mockResolvedValue({ id: 7, globalRole: "USER" });

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(ProjectMember.update).not.toHaveBeenCalled();
    });


    it("should return 403 when a non-admin tries to update an existing Project Admin", async () => {
      req.userId = 3;
      req.params.id = 1;
      req.body = { userId: 8, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 8, projectRole: "PROJECT_ADMIN" });
      User.findByPk.mockResolvedValue({ id: 3, globalRole: "USER" });

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(ProjectMember.update).not.toHaveBeenCalled();
    });


    it("should allow an Admin to update anyone, including another Project Admin", async () => {
      req.userId = 1;
      req.params.id = 1;
      req.body = { userId: 8, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 8, projectRole: "PROJECT_ADMIN" });
      User.findByPk.mockResolvedValue({ id: 1, globalRole: "ADMIN" });
      ProjectMember.update.mockResolvedValue([1]);

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });


    it("should allow a non-admin to update a Developer's role", async () => {
      req.userId = 3;
      req.params.id = 1;
      req.body = { userId: 9, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 9, projectRole: "DEVELOPER" });
      User.findByPk.mockResolvedValue({ id: 3, globalRole: "USER" });
      ProjectMember.update.mockResolvedValue([1]);

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });


    // FLAGGED — confirmed against the real controller, not just the test:
    // the authorization check only inspects the target's CURRENT
    // projectRole ("if (userToUpdate.projectRole === 'PROJECT_ADMIN')").
    // It never inspects the NEW projectRole being requested. So a non-admin
    // Project Admin can currently promote a Developer straight to
    // PROJECT_ADMIN. This test documents real, current behavior — worth a
    // team decision on whether the controller should also block promotions
    // TO PROJECT_ADMIN by non-admins, not just edits of existing ones.
    it("[gap] currently allows a non-admin to promote a Developer to PROJECT_ADMIN", async () => {
      req.userId = 3;
      req.params.id = 1;
      req.body = { userId: 9, projectRole: "PROJECT_ADMIN" };

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 9, projectRole: "DEVELOPER" });
      User.findByPk.mockResolvedValue({ id: 3, globalRole: "USER" });
      ProjectMember.update.mockResolvedValue([1]);

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });


    it("should still return 200 when the update matches but nothing actually changed", async () => {
      req.userId = 1;
      req.params.id = 1;
      req.body = { userId: 9, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 9, projectRole: "DEVELOPER" });
      User.findByPk.mockResolvedValue({ id: 1, globalRole: "ADMIN" });
      ProjectMember.update.mockResolvedValue([0]);

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });


    it("should return 500 on a DB error", async () => {
      req.userId = 1;
      req.params.id = 1;
      req.body = { userId: 9, projectRole: "DEVELOPER" };

      ProjectMember.findOne.mockRejectedValue(new Error("db down"));

      await projectController.updateProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });



  describe("update", () => {

    it("should update a project", async () => {
      req.params.id = 1;
      req.body = {
        name: "Updated Project",
      };

      Project.update.mockResolvedValue([1]);

      await projectController.update(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Project was updated successfully.",
        });
    });


    it("should return message when project does not exist", async () => {
      req.params.id = 99;

      Project.update.mockResolvedValue([0]);

      await projectController.update(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle update errors", async () => {
      Project.update.mockRejectedValue(
        new Error("error")
      );

      await projectController.update(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("delete", () => {

    it("should delete a project", async () => {
      req.params.id = 1;

      Project.destroy.mockResolvedValue(1);

      await projectController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Project was deleted successfully!",
        });
    });


    it("should return message when project does not exist", async () => {
      req.params.id = 99;

      Project.destroy.mockResolvedValue(0);

      await projectController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle delete errors", async () => {
      Project.destroy.mockRejectedValue(
        new Error("error")
      );

      await projectController.delete(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("deleteAll", () => {

    it("should delete all projects", async () => {
      Project.destroy.mockResolvedValue(6);

      await projectController.deleteAll(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "6 Projects were deleted successfully!",
        });
    });


    it("should handle deleteAll errors", async () => {
      Project.destroy.mockRejectedValue(
        new Error("error")
      );

      await projectController.deleteAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("deleteProjectMember", () => {

    it("should return 404 when the target member doesn't exist", async () => {
      req.params.id = 1;
      req.params.userId = 999;

      ProjectMember.findOne.mockResolvedValue(null);

      await projectController.deleteProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });


    it("should return 403 when a non-admin tries to delete a Project Admin", async () => {
      req.userId = 3;
      req.params.id = 1;
      req.params.userId = 8;

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 8, projectRole: "PROJECT_ADMIN" });
      User.findByPk.mockResolvedValue({ id: 3, globalRole: "USER" });

      await projectController.deleteProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(ProjectMember.destroy).not.toHaveBeenCalled();
    });


    it("should allow an Admin to delete a Project Admin", async () => {
      req.userId = 1;
      req.params.id = 1;
      req.params.userId = 8;

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 8, projectRole: "PROJECT_ADMIN" });
      User.findByPk.mockResolvedValue({ id: 1, globalRole: "ADMIN" });
      ProjectMember.destroy.mockResolvedValue(1);

      await projectController.deleteProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });


    it("should allow a non-admin to delete a Developer", async () => {
      req.userId = 3;
      req.params.id = 1;
      req.params.userId = 9;

      ProjectMember.findOne.mockResolvedValue({ projectId: 1, userId: 9, projectRole: "DEVELOPER" });
      ProjectMember.destroy.mockResolvedValue(1);

      await projectController.deleteProjectMember(req, res);

      // No User.findByPk call expected here since the target isn't a Project Admin.
      expect(res.status).toHaveBeenCalledWith(200);
    });


    it("should return 500 on a DB error", async () => {
      req.params.id = 1;
      req.params.userId = 9;

      ProjectMember.findOne.mockRejectedValue(new Error("db down"));

      await projectController.deleteProjectMember(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });

});