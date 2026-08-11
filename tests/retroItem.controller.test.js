const retroItemController = require("../app/controllers/retrospective.items.controller");
const db = require("../app/models");

const RetroItem = db.retroItem;

jest.mock("../app/models", () => ({
  retroItem: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  user: {},
  // The controller looks up the parent retro, then that retro's sprint,
  // to build the activity-log message ("added a ... item to the sprint
  // <name> retro"). Both need to resolve to something with the field the
  // controller reads next (retro.sprintId, then sprint.name).
  retrospective: {
    findByPk: jest.fn(),
  },
  sprint: {
    findByPk: jest.fn(),
  },
  Sequelize: {
    Op: {
      like: Symbol("like"),
    },
  },
}));

describe("RetroItem Controller", () => {
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
    it("should return 400 if itemType is missing", async () => {
      req.body = {
        content: "Good",
        userId: 1,
        retroId: 1,
      };

      await retroItemController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "itemType cannot be empty for retroItem!",
      });
    });


    it("should return 400 if content is missing", async () => {
      req.body = {
        itemType: "positive",
        userId: 1,
        retroId: 1,
      };

      await retroItemController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should return 400 if userId is missing", async () => {
      req.body = {
        itemType: "positive",
        content: "Good work",
        retroId: 1,
      };

      await retroItemController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should return 400 if retroId is missing", async () => {
      req.body = {
        itemType: "positive",
        content: "Good work",
        userId: 1,
      };

      await retroItemController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should create a retro item", async () => {
    const requestBody = {
        itemType: "positive",
        content: "Great job",
        userId: 1,
        retroId: 1,
    };

    const createdItem = {
        id: 1,
        ...requestBody,
    };

    req.body = requestBody;

    db.retrospective.findByPk.mockResolvedValue({ id: 1, sprintId: 1 });
    db.sprint.findByPk.mockResolvedValue({ id: 1, name: "Seeded Sprint 1" });
    RetroItem.create.mockResolvedValue(createdItem);

    await retroItemController.create(req, res);

    expect(RetroItem.create).toHaveBeenCalledWith(requestBody);
    expect(res.send).toHaveBeenCalledWith(createdItem);
    });


    it("should handle create errors", async () => {
      RetroItem.create.mockRejectedValue(
        new Error("Database error")
      );

      req.body = {
        itemType: "positive",
        content: "test",
        userId: 1,
        retroId: 1,
      };

      db.retrospective.findByPk.mockResolvedValue({ id: 1 });

      await retroItemController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });



  describe("findAll", () => {

    it("should return all retro items", async () => {
      const items = [{ id: 1 }];

      RetroItem.findAll.mockResolvedValue(items);

      await retroItemController.findAll(req, res);

      expect(RetroItem.findAll).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(items);
    });


    it("should filter by title", async () => {
      req.query.title = "test";

      RetroItem.findAll.mockResolvedValue([]);

      await retroItemController.findAll(req, res);

      expect(RetroItem.findAll).toHaveBeenCalled();
    });


    it("should handle errors", async () => {
      RetroItem.findAll.mockRejectedValue(
        new Error("DB error")
      );

      await retroItemController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });



  describe("findOne", () => {

    it("should return a retro item by id", async () => {
      req.params.id = 1;

      const item = { id: 1 };

      RetroItem.findByPk.mockResolvedValue(item);

      await retroItemController.findOne(req, res);

      expect(RetroItem.findByPk)
        .toHaveBeenCalledWith(
          1,
          expect.any(Object)
        );

      expect(res.send).toHaveBeenCalledWith(item);
    });


    it("should handle errors", async () => {
      req.params.id = 1;

      RetroItem.findByPk.mockRejectedValue(
        new Error("error")
      );

      await retroItemController.findOne(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });



  describe("findRetroItem", () => {

    it("should return items by retroId", async () => {
      req.params.retroId = 5;

      const items = [
        { id: 1, retroId: 5 }
      ];

      RetroItem.findAll.mockResolvedValue(items);

      await retroItemController.findRetroItem(req, res);

      expect(RetroItem.findAll)
        .toHaveBeenCalled();

      expect(res.status)
        .toHaveBeenCalledWith(200);

      expect(res.send)
        .toHaveBeenCalledWith(items);
    });


    it("should return 404 when no items found", async () => {
      req.params.retroId = 5;

      RetroItem.findAll.mockResolvedValue(null);

      await retroItemController.findRetroItem(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(404);
    });


    it("should handle errors", async () => {
      RetroItem.findAll.mockRejectedValue(
        new Error("error")
      );

      await retroItemController.findRetroItem(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("update", () => {

    it("should update a retro item", async () => {
      req.params.id = 1;
      req.body = {
        content: "Updated",
      };

      RetroItem.update.mockResolvedValue([1]);

      await retroItemController.update(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "RetroItem was updated successfully.",
      });
    });


    it("should return message if item not found", async () => {
      req.params.id = 1;

      RetroItem.update.mockResolvedValue([0]);

      await retroItemController.update(req, res);

      expect(res.send).toHaveBeenCalled();
    });


    it("should handle update errors", async () => {
      RetroItem.update.mockRejectedValue(
        new Error("error")
      );

      await retroItemController.update(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("delete", () => {

    it("should delete a retro item", async () => {
      req.params.id = 1;

      RetroItem.destroy.mockResolvedValue(1);

      await retroItemController.delete(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "RetroItem was deleted successfully!",
      });
    });


    it("should return message if item does not exist", async () => {
      req.params.id = 1;

      RetroItem.destroy.mockResolvedValue(0);

      await retroItemController.delete(req, res);

      expect(res.send).toHaveBeenCalled();
    });


    it("should handle delete errors", async () => {
      RetroItem.destroy.mockRejectedValue(
        new Error("error")
      );

      await retroItemController.delete(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("deleteAll", () => {

    it("should delete all retro items", async () => {
      RetroItem.destroy.mockResolvedValue(5);

      await retroItemController.deleteAll(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "5 RetroItems were deleted successfully!",
      });
    });


    it("should handle delete all errors", async () => {
      RetroItem.destroy.mockRejectedValue(
        new Error("error")
      );

      await retroItemController.deleteAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });

});