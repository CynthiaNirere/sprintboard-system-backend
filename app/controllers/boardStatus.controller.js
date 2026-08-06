const db = require("../models");
const BoardStatus = db.boardStatus;
const Op = db.Sequelize.Op;

// Create and Save a boardStatus
exports.create = async (req, res) => {
  // Validate request
  if (req.body.name === undefined) {
    return res.status(400).send({
      message: "Name cannot be empty for boardStatus!",
    });
  } if (req.body.columnOrder === undefined) {
    return res.status(400).send({
      message: "columnOrder cannot be empty for boardStatus!",
    });
  } if (req.body.projectId === undefined) {
    return res.status(400).send({
      message: "projectId cannot be empty for boardStatus!",
    });
  } if (req.body.githubEvent === undefined) {
    return res.status(400).send({
      message: "githubEvent cannot be empty for boardStatus!",
    });
  }

  // Create a boardStatus
  const boardStatus = {
    name: req.body.name,
    columnOrder: req.body.columnOrder,
    projectId: req.body.projectId,
    githubEvent: req.body.githubEvent
  };

  try {
    const data = await BoardStatus.create(boardStatus);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the boardStatus.",
    });
  }
};

// Retrieve all boardStatuses
exports.findAll = async (req, res) => {
  try {
    const data = await BoardStatus.findAll();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving boardStatuss.",
    });
  }
};
// Retrieve all boardStatuses for a project
exports.findAllForProject = async (req, res) => {
  const projectId = req.params.id;
  try {
    const data = await BoardStatus.findAll({
      where: {
        projectId: projectId
      },
      order: [["columnOrder", "ASC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving boardStatuss.",
    });
  }
};

// Find a single boardStatus with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await BoardStatus.findByPk(id);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving boardStatus with id=" + id,
    });
  }
};

// Find a single boardStatus with a column order
exports.findOneByColumn = async (req, res) => {
  const projectId = req.params.projectId;
  const columnOrder = req.params.columnOrder;
  try {
    const data = await BoardStatus.findOne({
      where: {
        projectId: projectId,
        columnOrder: columnOrder
      }
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving boardStatus with columnOrder=" + columnOrder,
    });
  }
};

// Update a boardStatus by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await BoardStatus.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "boardStatus was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update boardStatus with id=${id}. Maybe boardStatus was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating boardStatus with id=" + id,
    });
  }
};

// Delete a boardStatus with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await BoardStatus.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "boardStatus was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete boardStatus with id=${id}. Maybe boardStatus was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete boardStatus with id=" + id,
    });
  }
};

// Delete all boardStatuss from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await BoardStatus.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} boardStatuss were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all boardStatuss.",
    });
  }
};