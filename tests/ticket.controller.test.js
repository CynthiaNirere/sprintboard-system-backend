const ticketController = require("../app/controllers/ticket.controller");
const db = require("../app/models");
const githubAutomation = require("../app/services/githubAutomation.service");

const Ticket = db.ticket;

jest.mock("../app/models", () => ({
  ticket: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  test: {},
  Sequelize: {
    Op: {
      like: Symbol("like"),
    },
  },
}));

jest.mock("../app/services/githubAutomation.service", () => ({
  runStatusChangeAutomation: jest.fn(),
}));

describe("Ticket Controller", () => {
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
      req.body = {};

      await ticketController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Name cannot be empty for ticket!",
      });
    });


    it("should create a ticket", async () => {
      const requestBody = {
        title: "Fix login bug",
        description: "Users cannot login",
        type: "bug",
        priority: "high",
        storyPoints: 5,
        githubBranchName: "fix-login",
        githubPrURL: "https://github.com/pr/1",
        githubIssueNumber: 10,
        assigneeId: 2,
        projectId: 1,
        sprintId: 3,
        statusId: 1,
        repoId: null,
      };

      const createdTicket = {
        id: 1,
        ...requestBody,
      };

      req.body = requestBody;

      Ticket.create.mockResolvedValue(createdTicket);

      await ticketController.create(req, res);

      expect(Ticket.create)
        .toHaveBeenCalledWith(requestBody);

      expect(res.send)
        .toHaveBeenCalledWith(createdTicket);
    });


    it("should create ticket with null optional fields", async () => {
      const requestBody = {
        title: "New ticket",
        type: "task",
        statusId: 1,
      };

      const expectedTicket = {
        title: "New ticket",
        description: undefined,
        type: "task",
        priority: null,
        storyPoints: null,
        githubBranchName: null,
        githubPrURL: null,
        githubIssueNumber: null,
        assigneeId: null,
        projectId: null,
        sprintId: null,
        statusId: 1,
        repoId: null,
      };

      req.body = requestBody;

      Ticket.create.mockResolvedValue(expectedTicket);

      await ticketController.create(req, res);

      expect(Ticket.create)
        .toHaveBeenCalledWith(expectedTicket);

      expect(res.send)
        .toHaveBeenCalledWith(expectedTicket);
    });


    it("should handle create errors", async () => {
      Ticket.create.mockRejectedValue(
        new Error("Database error")
      );

      req.body = {
        title: "Ticket",
      };

      await ticketController.create(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findAll", () => {

    it("should return all tickets", async () => {
      const tickets = [
        {
          id: 1,
          title: "Ticket",
        },
      ];

      Ticket.findAll.mockResolvedValue(tickets);

      await ticketController.findAll(req, res);

      expect(Ticket.findAll)
        .toHaveBeenCalled();

      expect(res.send)
        .toHaveBeenCalledWith(tickets);
    });


    it("should handle findAll errors", async () => {
      Ticket.findAll.mockRejectedValue(
        new Error("error")
      );

      await ticketController.findAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findOne", () => {

    it("should return a ticket by id", async () => {
      req.params.id = 1;

      const ticket = {
        id: 1,
        title: "Ticket",
      };

      Ticket.findByPk.mockResolvedValue(ticket);

      await ticketController.findOne(req, res);

      expect(Ticket.findByPk)
        .toHaveBeenCalledWith(
          1,
          expect.any(Object)
        );

      expect(res.send)
        .toHaveBeenCalledWith(ticket);
    });


    it("should handle findOne errors", async () => {
      req.params.id = 1;

      Ticket.findByPk.mockRejectedValue(
        new Error("error")
      );

      await ticketController.findOne(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findTicketsForAProject", () => {

    it("should return tickets for a project", async () => {
      req.params.id = 5;

      const tickets = [
        {
          id: 1,
          projectId: 5,
        },
      ];

      Ticket.findAll.mockResolvedValue(tickets);

      await ticketController.findTicketsForAProject(req, res);

      expect(Ticket.findAll)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              projectId: 5,
            },
          })
        );

      expect(res.send)
        .toHaveBeenCalledWith(tickets);
    });


    it("should handle project ticket errors", async () => {
      Ticket.findAll.mockRejectedValue(
        new Error("error")
      );

      await ticketController.findTicketsForAProject(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("findTicketsForASprint", () => {

    it("should return tickets for a sprint", async () => {
      req.params.id = 3;

      const tickets = [
        {
          id: 1,
          sprintId: 3,
        },
      ];

      Ticket.findAll.mockResolvedValue(tickets);

      await ticketController.findTicketsForASprint(req, res);

      expect(Ticket.findAll)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              sprintId: 3,
            },
          })
        );

      expect(res.send)
        .toHaveBeenCalledWith(tickets);
    });


    it("should handle sprint ticket errors", async () => {
      Ticket.findAll.mockRejectedValue(
        new Error("error")
      );

      await ticketController.findTicketsForASprint(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("update", () => {

    it("should update a ticket", async () => {
      req.params.id = 1;
      req.body = {
        title: "Updated",
      };

      Ticket.update.mockResolvedValue([1]);

      await ticketController.update(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Ticket was updated successfully.",
        });
    });


    it("should return message when ticket does not exist", async () => {
      req.params.id = 99;

      Ticket.update.mockResolvedValue([0]);

      await ticketController.update(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle update errors", async () => {
      Ticket.update.mockRejectedValue(
        new Error("error")
      );

      await ticketController.update(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("update — GitHub branch automation", () => {

    beforeEach(() => {
      req.params.id = 1;
      Ticket.update.mockResolvedValue([1]);
      Ticket.findByPk.mockResolvedValue({ id: 1, title: "A ticket", statusId: 5 });
      githubAutomation.runStatusChangeAutomation.mockResolvedValue({
        ran: false,
        reason: "NO_EVENT",
      });
    });


    it("does not run automation when the body has no statusId", async () => {
      req.body = { title: "Updated" };

      await ticketController.update(req, res);

      expect(githubAutomation.runStatusChangeAutomation).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({
        message: "Ticket was updated successfully.",
      });
    });


    it("does not run automation when the status is unchanged", async () => {
      req.body = { statusId: 5 };

      await ticketController.update(req, res);

      expect(githubAutomation.runStatusChangeAutomation).not.toHaveBeenCalled();
    });


    it("treats a string statusId matching the stored number as unchanged", async () => {
      req.body = { statusId: "5" };

      await ticketController.update(req, res);

      expect(githubAutomation.runStatusChangeAutomation).not.toHaveBeenCalled();
    });


    it("runs automation once when the status actually changes", async () => {
      req.body = { statusId: 6 };
      req.userId = 9;

      await ticketController.update(req, res);

      expect(githubAutomation.runStatusChangeAutomation).toHaveBeenCalledTimes(1);
      expect(githubAutomation.runStatusChangeAutomation).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 1,
          newStatusId: 6,
          actingUserId: 9,
        })
      );
    });


    it("omits the github key when no automation was configured", async () => {
      req.body = { statusId: 6 };

      await ticketController.update(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Ticket was updated successfully.",
      });
    });


    it("reports the branch when automation succeeds", async () => {
      req.body = { statusId: 6 };
      githubAutomation.runStatusChangeAutomation.mockResolvedValue({
        ran: true,
        ok: true,
        branch: "bugfix/ticket-1-a-ticket",
        alreadyExisted: false,
        repoId: 3,
      });

      await ticketController.update(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Ticket was updated successfully.",
        github: {
          ran: true,
          ok: true,
          branch: "bugfix/ticket-1-a-ticket",
          alreadyExisted: false,
          repoId: 3,
        },
      });
    });


    it("still succeeds when the GitHub call failed", async () => {
      req.body = { statusId: 6 };
      githubAutomation.runStatusChangeAutomation.mockResolvedValue({
        ran: true,
        ok: false,
        code: "BAD_TOKEN",
        message: "GitHub rejected the token.",
      });

      await ticketController.update(req, res);

      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: "Ticket was updated successfully.",
        github: {
          ran: true,
          ok: false,
          code: "BAD_TOKEN",
          message: "GitHub rejected the token.",
        },
      });
    });


    it("still succeeds when the automation itself throws", async () => {
      req.body = { statusId: 6 };
      githubAutomation.runStatusChangeAutomation.mockRejectedValue(
        new Error("boom")
      );

      await ticketController.update(req, res);

      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: "Ticket was updated successfully.",
      });
    });


    it("skips automation when the ticket could not be read beforehand", async () => {
      req.body = { statusId: 6 };
      Ticket.findByPk.mockResolvedValue(null);

      await ticketController.update(req, res);

      expect(githubAutomation.runStatusChangeAutomation).not.toHaveBeenCalled();
    });

  });



  describe("delete", () => {

    it("should delete a ticket", async () => {
      req.params.id = 1;

      Ticket.destroy.mockResolvedValue(1);

      await ticketController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "Ticket was deleted successfully!",
        });
    });


    it("should return message when ticket does not exist", async () => {
      req.params.id = 99;

      Ticket.destroy.mockResolvedValue(0);

      await ticketController.delete(req, res);

      expect(res.send)
        .toHaveBeenCalled();
    });


    it("should handle delete errors", async () => {
      Ticket.destroy.mockRejectedValue(
        new Error("error")
      );

      await ticketController.delete(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });



  describe("deleteAll", () => {

    it("should delete all tickets", async () => {
      Ticket.destroy.mockResolvedValue(4);

      await ticketController.deleteAll(req, res);

      expect(res.send)
        .toHaveBeenCalledWith({
          message: "4 Tickets were deleted successfully!",
        });
    });


    it("should handle deleteAll errors", async () => {
      Ticket.destroy.mockRejectedValue(
        new Error("error")
      );

      await ticketController.deleteAll(req, res);

      expect(res.status)
        .toHaveBeenCalledWith(500);
    });

  });

});