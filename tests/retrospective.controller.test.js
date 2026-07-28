const retroController = require("../app/controllers/retrospective.controller");
const db = require("../app/models");

const Retro = db.retrospective;

jest.mock("../app/models", () => ({
  retrospective: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  user: {},
  sprint: {},
  retroItem: {},
  Sequelize: {
    Op: {
      like: Symbol("like"),
    },
  },
}));

describe("Retro Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });


  describe("create", () => {

    it("should return 400 if title is missing", async () => {
      req.body = {
        status: "active",
        sprintId: 1,
      };

      await retroController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "title cannot be empty for retro!",
      });
    });


    it("should return 400 if status is missing", async () => {
      req.body = {
        title: "Sprint Retro",
        sprintId: 1,
      };

      await retroController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should return 400 if sprintId is missing", async () => {
      req.body = {
        title: "Sprint Retro",
        status: "active",
      };

      await retroController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should create a retro", async () => {
      const requestBody = {
        title: "Sprint Retro",
        status: "active",
        sprintId: 1,
      };

      const createdRetro = {
        id: 1,
        ...requestBody,
        completionDate: null,
      };

      req.body = requestBody;

      Retro.create.mockResolvedValue(createdRetro);

      await retroController.create(req, res);

      expect(Retro.create).toHaveBeenCalledWith({
        ...requestBody,
        completionDate: null,
      });

      expect(res.send).toHaveBeenCalledWith(createdRetro);
    });


    it("should create a retro with completionDate", async () => {
      const requestBody = {
        title: "Sprint Retro",
        status: "completed",
        sprintId: 1,
        completionDate: "2026-07-28",
      };

      req.body = requestBody;

      Retro.create.mockResolvedValue(requestBody);

      await retroController.create(req, res);

      expect(Retro.create)
        .toHaveBeenCalledWith(requestBody);

      expect(res.send)
        .toHaveBeenCalledWith(requestBody);
    });


    it("should handle create errors", async () => {
      Retro.create.mockRejectedValue(
        new Error("Database error")
      );

      req.body = {
        title: "Retro",
        status: "active",
        sprintId: 1,
      };

      await retroController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findAll", () => {

    it("should return all retros", async () => {
      const retros = [
        {
          id: 1,
          title: "Retro",
        },
      ];

      Retro.findAll.mockResolvedValue(retros);

      await retroController.findAll(req, res);

      expect(Retro.findAll)
        .toHaveBeenCalled();

      expect(res.send)
        .toHaveBeenCalledWith(retros);
    });


    it("should filter retros by title", async () => {
      req.query.title = "Sprint";

      Retro.findAll.mockResolvedValue([]);

      await retroController.findAll(req, res);

      expect(Retro.findAll)
        .toHaveBeenCalled();
    });


    it("should handle findAll errors", async () => {
      Retro.findAll.mockRejectedValue(
        new Error("error")
      );

      await retroController.findAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findOne", () => {

    it("should return a retro by id", async () => {
      req.params.id = 1;

      const retro = {
        id: 1,
        title: "Retro",
      };

      Retro.findByPk.mockResolvedValue(retro);

      await retroController.findOne(req, res);

      expect(Retro.findByPk)
        .toHaveBeenCalledWith(
          1,
          expect.any(Object)
        );

      expect(res.send)
        .toHaveBeenCalledWith(retro);
    });


    it("should handle findOne errors", async () => {
      req.params.id = 1;

      Retro.findByPk.mockRejectedValue(
        new Error("error")
      );

      await retroController.findOne(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findSprintRetro", () => {

    it("should return a retro by sprintId", async () => {
      req.params.sprintId = 10;

      const retro = {
        id: 1,
        sprintId: 10,
      };

      Retro.findOne.mockResolvedValue(retro);

      await retroController.findSprintRetro(req, res);

      expect(Retro.findOne)
        .toHaveBeenCalled();

      expect(res.status)
        .toHaveBeenCalledWith(200);

      expect(res.send)
        .toHaveBeenCalledWith(retro);
    });


    it("should return 404 if retro is not found", async () => {
      req.params.sprintId = 10;

      Retro.findOne.mockResolvedValue(null);

      await retroController.findSprintRetro(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(404);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Retro(s) not found.",
        });
    });


    it("should handle errors", async () => {
      Retro.findOne.mockRejectedValue(
        new Error("error")
      );

      await retroController.findSprintRetro(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("update", () => {

    it("should update a retro", async () => {
      req.params.id = 1;
      req.body = {
        status: "completed",
      };

      Retro.update.mockResolvedValue([1]);

      await retroController.update(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Retro was updated successfully.",
        });
    });


    it("should return message when retro does not exist", async () => {
      req.params.id = 99;

      Retro.update.mockResolvedValue([0]);

      await retroController.update(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle update errors", async () => {
      Retro.update.mockRejectedValue(
        new Error("error")
      );

      await retroController.update(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("delete", () => {

    it("should delete a retro", async () => {
      req.params.id = 1;

      Retro.destroy.mockResolvedValue(1);

      await retroController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Retro was deleted successfully!",
        });
    });


    it("should return message when retro does not exist", async () => {
      req.params.id = 99;

      Retro.destroy.mockResolvedValue(0);

      await retroController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle delete errors", async () => {
      Retro.destroy.mockRejectedValue(
        new Error("error")
      );

      await retroController.delete(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("deleteAll", () => {

    it("should delete all retros", async () => {
      Retro.destroy.mockResolvedValue(3);

      await retroController.deleteAll(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "3 Retros were deleted successfully!",
        });
    });


    it("should handle deleteAll errors", async () => {
      Retro.destroy.mockRejectedValue(
        new Error("error")
      );

      await retroController.deleteAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });

});