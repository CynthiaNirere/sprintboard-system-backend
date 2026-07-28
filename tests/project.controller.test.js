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

const db = require("../app/models");
const projectController = require("../app/controllers/project.controller");

const Project = db.project;


const mockRes = () => {
  const res = {};

  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);

  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Project Controller", () => {

  describe("create", () => {

    it("should return 400 if name is missing", async () => {

      const req = {
        body: {},
        userId: 1,
      };

      const res = mockRes();
      await projectController.create(req, res);
      expect(res.status)
        .toHaveBeenCalledWith(400);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Name cannot be empty for project!",
        });

    });

    it("should create a project", async () => {

      const req = {
        body: {
          name: "Website Project",
          description: "New website",
        },
        userId: 1,
      };

      const res = mockRes();

      const createdProject = {
        id: 1,
        name: "Website Project",
        description: "New website",
        createdBy: 1,
      };

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

      const req = {
        body: {
          name: "Project",
        },
        userId: 1,
      };

      const res = mockRes();

      Project.create.mockRejectedValue(
        new Error("Database error")
      );
      await projectController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);

    });

  });

  describe("findAll", () => {

    it("should return all projects", async () => {

      const req = {
        query: {},
      };

      const res = mockRes();

      const projects = [
        {
          id: 1,
          name: "Project",
        }
      ];

      Project.findAll.mockResolvedValue(projects);

      await projectController.findAll(req,res);

      expect(Project.findAll)
        .toHaveBeenCalled();


      expect(res.send)
        .toHaveBeenCalledWith(projects);

    });

    it("should filter projects by name", async () => {


      const req = {
        query:{
          name:"Web"
        }
      };

      const res = mockRes();

      Project.findAll.mockResolvedValue([]);

      await projectController.findAll(req,res);

      expect(Project.findAll)
        .toHaveBeenCalled();

    });


    it("should handle findAll errors", async()=>{

      const req = {
        query:{}
      };

      const res = mockRes();

      Project.findAll.mockRejectedValue(
        new Error("error")
      );
      await projectController.findAll(req,res);
      expect(res.status)
        .toHaveBeenCalledWith(500);

    });


  });




  describe("findOne",()=>{


    it("should return project by id", async()=>{


      const req = {
        params:{
          id:1
        }
      };

      const res = mockRes();

      const project = {
        id:1,
        name:"Project"
      };

      Project.findByPk.mockResolvedValue(project);

      await projectController.findOne(req,res);
      expect(Project.findByPk)
        .toHaveBeenCalledWith(
          1,
          expect.any(Object)
        );


      expect(res.send)
        .toHaveBeenCalledWith(project);

    });



    it("should handle findOne errors", async()=>{


      const req = {
        params:{
          id:1
        }
      };


      const res = mockRes();

      Project.findByPk.mockRejectedValue(
        new Error("error")
      );


      await projectController.findOne(req,res);
      expect(res.status)
        .toHaveBeenCalledWith(500);

    });


  });




  describe("update",()=>{
    it("should update a project",async()=>{


      const req={
        params:{
          id:1
        },
        body:{
          name:"Updated"
        }
      };

      const res=mockRes();

      Project.update.mockResolvedValue([1]);
      await projectController.update(req,res);
      expect(res.send)
        .toHaveBeenCalledWith({
          message:"Project was updated successfully."
        });

    });

    it("should handle update errors",async()=>{

      const req={
        params:{
          id:1
        }
      };


      const res=mockRes();

      Project.update.mockRejectedValue(
        new Error("error")
      );

      await projectController.update(req,res);

      expect(res.status)
        .toHaveBeenCalledWith(500);

    });

  });

  describe("delete",()=>{


    it("should delete project",async()=>{


      const req={
        params:{
          id:1
        }
      };

      const res=mockRes();

      Project.destroy.mockResolvedValue(1);

      await projectController.delete(req,res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message:"Project was deleted successfully!"
        });


    });



    it("should handle delete errors",async()=>{

      const req={
        params:{
          id:1
        }
      };

      const res=mockRes();

      Project.destroy.mockRejectedValue(
        new Error("error")
      );

      await projectController.delete(req,res);

      expect(res.status)
        .toHaveBeenCalledWith(500);

    });

  });


  describe("deleteAll",()=>{

    it("should delete all projects",async()=>{

      const req={};

      const res=mockRes();
      Project.destroy.mockResolvedValue(5);

      await projectController.deleteAll(req,res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message:"5 Projects were deleted successfully!"
        });

    });

  });

});