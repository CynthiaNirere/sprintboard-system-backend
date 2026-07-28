const projectController = require("../app/controllers/project.controller");
const db = require("../app/models");

const Project = db.project;

jest.mock("../app/models", () => ({
  project: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  user: {},
  sprint: {},
  ticket: {},
  boardStatus: {},
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


    it("should create a project", async () => {
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

      await projectController.create(req, res);

      expect(Project.create)
        .toHaveBeenCalledWith({
          name: "Website Project",
          description: "New website",
          createdBy: 1,
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

});