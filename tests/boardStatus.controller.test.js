const boardStatusController = require("../app/controllers/boardStatus.controller");
const db = require("../app/models");

const BoardStatus = db.boardStatus;
const Ticket = db.ticket;

jest.mock("../app/models", () => ({
  boardStatus: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  ticket: {
    update: jest.fn(),
  },
  Sequelize: {
    Op: {
      like: Symbol("like"),
      lt: Symbol("lt"),
      ne: Symbol("ne"),
    },
  },
}));

describe("BoardStatus Controller", () => {
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

    it("should return 400 if name is missing", async () => {
      req.body = {
        columnOrder: 1,
        projectId: 1,
      };

      await boardStatusController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(400);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Name cannot be empty for boardStatus!",
        });
    });


    it("should return 400 if columnOrder is missing", async () => {
      req.body = {
        name: "Todo",
        projectId: 1,
      };

      await boardStatusController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(400);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "columnOrder cannot be empty for boardStatus!",
        });
    });


    it("should return 400 if projectId is missing", async () => {
      req.body = {
        name: "Todo",
        columnOrder: 1,
      };

      await boardStatusController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(400);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "projectId cannot be empty for boardStatus!",
        });
    });


    it("should create a board status", async () => {
      const requestBody = {
        name: "In Progress",
        columnOrder: 2,
        projectId: 1,
        githubEvent: "none",
      };

      const createdStatus = {
        id: 1,
        ...requestBody,
      };

      req.body = requestBody;

      BoardStatus.create.mockResolvedValue(createdStatus);

      await boardStatusController.create(req, res);

      expect(BoardStatus.create)
        .toHaveBeenCalledWith(requestBody);

      expect(res.send)
        .toHaveBeenCalledWith(createdStatus);
    });


    it("should handle create errors", async () => {
      BoardStatus.create.mockRejectedValue(
        new Error("Database error")
      );

      req.body = {
        name: "Todo",
        columnOrder: 1,
        projectId: 1,
        githubEvent: "none",
      };

      await boardStatusController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findAll", () => {

    it("should return all board statuses", async () => {
      const statuses = [
        {
          id: 1,
          name: "Todo",
        },
      ];

      BoardStatus.findAll.mockResolvedValue(statuses);

      await boardStatusController.findAll(req, res);

      expect(BoardStatus.findAll)
        .toHaveBeenCalled();

      expect(res.send)
        .toHaveBeenCalledWith(statuses);
    });


    it("should handle findAll errors", async () => {
      BoardStatus.findAll.mockRejectedValue(
        new Error("error")
      );

      await boardStatusController.findAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findAllForProject", () => {

    it("should return board statuses for a project", async () => {
      req.params.id = 5;

      const statuses = [
        {
          id: 1,
          projectId: 5,
        },
      ];

      BoardStatus.findAll.mockResolvedValue(statuses);

      await boardStatusController.findAllForProject(req, res);

      expect(BoardStatus.findAll)
        .toHaveBeenCalledWith({
          where: {
            projectId: 5,
          },
          order: [
            [
              "columnOrder",
              "ASC",
            ],
          ],
        });

      expect(res.send)
        .toHaveBeenCalledWith(statuses);
    });


    it("should handle findAllForProject errors", async () => {
      BoardStatus.findAll.mockRejectedValue(
        new Error("error")
      );

      await boardStatusController.findAllForProject(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findOne", () => {

    it("should return a board status by id", async () => {
      req.params.id = 1;

      const status = {
        id: 1,
        name: "Done",
      };

      BoardStatus.findByPk.mockResolvedValue(status);

      await boardStatusController.findOne(req, res);

      expect(BoardStatus.findByPk)
        .toHaveBeenCalledWith(1);

      expect(res.send)
        .toHaveBeenCalledWith(status);
    });


    it("should handle findOne errors", async () => {
      req.params.id = 1;

      BoardStatus.findByPk.mockRejectedValue(
        new Error("error")
      );

      await boardStatusController.findOne(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("update", () => {

    it("should update a board status", async () => {
      req.params.id = 1;

      req.body = {
        name: "Updated",
      };

      BoardStatus.findByPk.mockResolvedValue({ id: 1, name: "Updated" });
      BoardStatus.update.mockResolvedValue([1]);

      await boardStatusController.update(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "boardStatus was updated successfully.",
        });
    });


    it("should return message when board status does not exist", async () => {
      req.params.id = 99;

      BoardStatus.findByPk.mockResolvedValue({ id: 99, name: "Old Name" });
      BoardStatus.update.mockResolvedValue([0]);

      await boardStatusController.update(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle update errors", async () => {
      BoardStatus.findByPk.mockResolvedValue({ id: 1, name: "Some Status" });
      BoardStatus.update.mockRejectedValue(
        new Error("error")
      );

      await boardStatusController.update(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("delete", () => {

    it("should delete a board status", async () => {
      req.params.id = 1;
      req.params.projectId = 1;

      // The controller now looks the status up first (to find its
      // columnOrder), then checks for a fallback column before touching
      // any tickets — all of this has to resolve before it ever reaches
      // BoardStatus.destroy.
      BoardStatus.findByPk.mockResolvedValue({ id: 1, columnOrder: 2 });
      BoardStatus.findOne.mockResolvedValue(null);
      Ticket.update.mockResolvedValue([0]);
      BoardStatus.destroy.mockResolvedValue(1);

      await boardStatusController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "boardStatus was deleted successfully!",
        });
    });


    it("should return message when board status does not exist", async () => {
      req.params.id = 99;

      BoardStatus.destroy.mockResolvedValue(0);

      await boardStatusController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle delete errors", async () => {
      BoardStatus.destroy.mockRejectedValue(
        new Error("error")
      );

      await boardStatusController.delete(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("deleteAll", () => {

    it("should delete all board statuses", async () => {
      BoardStatus.destroy.mockResolvedValue(7);

      await boardStatusController.deleteAll(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "7 boardStatuss were deleted successfully!",
        });
    });


    it("should handle deleteAll errors", async () => {
      BoardStatus.destroy.mockRejectedValue(
        new Error("error")
      );

      await boardStatusController.deleteAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });

});