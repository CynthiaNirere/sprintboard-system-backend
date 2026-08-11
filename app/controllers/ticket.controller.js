const db = require("../models");
const Ticket = db.ticket;
const BoardStatus = db.boardStatus;
const Op = db.Sequelize.Op;
const UserActivityLog = db.userActivityLog;
const { LogActions } = require("../config/userActivityLogActions");
const githubAutomation = require("../services/githubAutomation.service");
const {logTicketCreated, logTicketChanged} = require("../services/ticketHistoryService");

// Create and Save a Ticket
exports.create = async (req, res) => {
  // Validate request
  if (req.body.title === undefined) {
    return res.status(400).send({
      message: "Name cannot be empty for ticket!",
    });
  }

  // Create a Ticket
  const ticket = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    priority: req.body.priority ?? null,
    storyPoints: req.body.storyPoints ?? null,
    githubBranchName: req.body.githubBranchName ?? null,
    githubPrURL: req.body.githubPrURL ?? null,
    githubIssueNumber: req.body.githubIssueNumber ?? null,
    assigneeId: req.body.assigneeId ?? null,
    projectId: req.body.projectId ?? null,
    sprintId: req.body.sprintId ?? null,
    repoId: req.body.repoId ?? null,
    statusId: req.body.statusId ?? null,
  };

  try {
    const data = await Ticket.create(ticket);
    const requestedById = req.userId;

    // Log the action to the user activity log
    try {
      await UserActivityLog.create({
        userId: requestedById,
        action: LogActions.TICKET_CREATED,
        detail: ` created ticket "${ticket.title}"`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      await logTicketCreated(data.id, requestedById);
    } catch (error) {
      console.log("Error writing TICKET_CREATED action to User Activity Log: ", error);
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Ticket.",
    });
  }
};

// Retrieve all Tickets
exports.findAll = async (req, res) => {
  try {
    const data = await Ticket.findAll();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving tickets.",
    });
  }
};

// Find a single Ticket with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Ticket.findByPk(id, {
      include: [{model: db.test, as: "ticketTests"}]
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Ticket with id=" + id,
    });
  }
};

// Find tickets for a project
exports.findTicketsForAProject = async (req, res) => {
  const projectId = req.params.id;

  try {
    const data = await Ticket.findAll(
      {
        where: {projectId: projectId},
      include: [{model: db.test, as: "ticketTests"}]
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Ticket with id=" + id,
    });
  }
};

// Find tickets for a project
exports.findTicketsForASprint = async (req, res) => {
  const sprintId = req.params.id;

  try {
    const data = await Ticket.findAll(
      {
        where: {sprintId: sprintId},
      include: [{model: db.test, as: "ticketTests"}]
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Ticket with id=" + id,
    });
  }
};

// Find tickets for a user
exports.findTicketsForAUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const data = await Ticket.findAll(
      {
        where: {assigneeId: userId},
      });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving tickets for user with id=" + userId,
    });
  }
};

// Update a Ticket by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    // Capture the status before the write — afterwards there is no way to tell
    // whether this update actually moved the ticket to a different column.
    let previousStatusId = null;
    let before = null;
    try {
      before = await Ticket.findByPk(id);
      previousStatusId = before ? before.statusId : null;
    } catch (error) {
      console.log("Could not read ticket before update: ", error);
    }

    const num = await Ticket.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      const requestedById = req.userId;
      
      try {
        const ticket = await Ticket.findByPk(id);
        await UserActivityLog.create({
          userId: requestedById,
          action: LogActions.TICKET_UPDATED,
          detail: ` updated ticket "${ticket.title}"`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
        await logTicketChanged(before, ticket, requestedById);
      } catch (error) {
        console.log("Error writing TICKET_UPDATED action to User Activity Log: ", error);
      }

      // If this update moved the ticket into a different board status, run any
      // GitHub automation attached to that status. The move is already
      // committed and is what the user actually asked for, so a GitHub failure
      // is reported alongside the success, never raised as an error.
      let github;
      const statusChanged =
        req.body.statusId !== undefined &&
        previousStatusId !== null &&
        String(req.body.statusId) !== String(previousStatusId);
      if (statusChanged) {
        try {

          const result = await githubAutomation.runStatusChangeAutomation({
            ticketId: id,
            newStatusId: req.body.statusId,
            actingUserId: requestedById,
            req: req,
          });
          if (result && result.ran) github = result;
        } catch (error) {
          console.log("Error running GitHub status automation: ", error);
        }
      }

      res.send({
        message: "Ticket was updated successfully.",
        ...(github ? { github: github } : {}),
      });
    } else {
      res.send({
        message: `Cannot update Ticket with id=${id}. Maybe Ticket was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Ticket with id=" + id,
    });
  }
};

// Delete a Ticket with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;
  const ticket = await Ticket.findByPk(id);

  try {
    const number = await Ticket.destroy({
      where: { id: id },
    });
    if (number == 1) {
      const requestedById = req.userId;
      // Log the action to the user activity log
      try {
        await UserActivityLog.create({
          userId: requestedById,
          action: LogActions.TICKET_DELETED,
          detail: ` deleted ticket "${ticket.title}"`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing TICKET_DELETED action to User Activity Log: ", error);
      }

      res.send({
        message: "Ticket was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete Ticket with id=${id}. Maybe Ticket was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Ticket with id=" + id,
    });
  }
};

// Delete all Tickets from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await Ticket.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Tickets were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all tickets.",
    });
  }
};
// Tickets in a given sprint
exports.findBySprint = async (req, res) => {
  const sprintId = req.params.sprintId;
  try {
    const data = await Ticket.findAll({
      where: { sprintId: sprintId },
      order: [["priority", "ASC"], ["createdAt", "ASC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving sprint tickets." });
  }
};

// Backlog: tickets with no sprint, for a project
exports.findBacklog = async (req, res) => {
  const projectId = req.query.projectId;
  if (projectId === undefined) {
    return res.status(400).send({ message: "projectId is required to view a backlog!" });
  }
  try {
    const data = await Ticket.findAll({
      where: { projectId: projectId, sprintId: null },
      order: [["priority", "ASC"], ["createdAt", "ASC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving the backlog." });
  }
};

// Move a ticket into a sprint
exports.assignToSprint = async (req, res) => {
  const id = req.params.id;
  const sprintId = req.body.sprintId;

  if (sprintId === undefined) {
    return res.status(400).send({ message: "sprintId is required!" });
  }
  try {
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).send({ message: `Ticket with id=${id} not found.`});
    }

    let newBoardStatusId = ticket.statusId;

    if (!newBoardStatusId) {
      const firstBoardStatusColumn = await BoardStatus.findOne({
        where: {
          projectId: ticket.projectId
        },
        order: [["columnOrder", "ASC"]]
      });

      if (firstBoardStatusColumn) {
        newBoardStatusId = firstBoardStatusColumn.id;
      }
    }

    const num = await Ticket.update({ sprintId: sprintId, statusId: newBoardStatusId }, { where: { id: id } });
    const after = await Ticket.findByPk(id);
    try{

      await logTicketChanged(ticket, after, req.userId);
    }catch(error){

    }
    if (num == 1) res.send({ message: "Ticket moved to sprint." });
    else res.send({ message: `Cannot move Ticket with id=${id}.` });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error moving ticket." });
  }
};

// Send a ticket back to the backlog with all info displaying
exports.removeFromSprint = async (req, res) => {
  const id = req.params.id;
  try {
    const before = await Ticket.findByPk(id);
    const num = await Ticket.update({ sprintId: null }, { where: { id: id } });
    const after = await Ticket.findByPk(id);
    await logTicketChanged(before, after, req.userId);
    if (num == 1) res.send({ message: "Ticket returned to backlog." });
    else res.send({ message: `Cannot update Ticket with id=${id}.` });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating ticket." });
  }
};