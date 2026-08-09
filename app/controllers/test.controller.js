const db = require("../models");
const Test = db.test;
const Op = db.Sequelize.Op;

// Create and Save a Test
exports.create = async (req, res) => {
  // Validate request
  if (req.body.title === undefined) {
    return res.status(400).send({
      message: "Title cannot be empty for test!",
    });
  }if (req.body.description === undefined) {
    return res.status(400).send({
      message: "Description cannot be empty for test!",
    });
  }if (req.body.ticketId === undefined) {
    return res.status(400).send({
      message: "ticketId cannot be empty for test!",
    });
  }

  // Create a Test
  const test = {
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    findings: req.body.findings || null,
    ownerId: req.body.userId,
    ticketId: req.body.ticketId,
  };

  try {
    const data = await Test.create(test);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Test.",
    });
  }
};

// Retrieve all Tests
exports.findAll = async (req, res) => {
  const ticketId = req.params.ticketId;
  
  try {
    const data = await Test.findAll({
      where: {
        ticketId: ticketId
      }
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving tests.",
    });
  }
};

// Find a single Test with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Test.findByPk(id);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Test with id=" + id,
    });
  }
};

// Update a Test by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Test.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "Test was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update Test with id=${id}. Maybe Test was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Test with id=" + id,
    });
  }
};

// Delete a Test with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await Test.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "Test was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete Test with id=${id}. Maybe Test was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Test with id=" + id,
    });
  }
};

// Delete all Tests from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await Test.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Tests were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all tests.",
    });
  }
};