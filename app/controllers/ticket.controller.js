const db = require("../models");
const Ticket = db.ticket;
const Op = db.Sequelize.Op;

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
    statusId: req.body.statusId ,
  };

  try {
    const data = await Ticket.create(ticket);
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
    const num = await Ticket.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "Ticket was updated successfully.",
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

  try {
    const number = await Ticket.destroy({
      where: { id: id },
    });
    if (number == 1) {
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
    const num = await Ticket.update({ sprintId: sprintId }, { where: { id: id } });
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
    const num = await Ticket.update({ sprintId: null }, { where: { id: id } });
    if (num == 1) res.send({ message: "Ticket returned to backlog." });
    else res.send({ message: `Cannot update Ticket with id=${id}.` });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating ticket." });
  }
};