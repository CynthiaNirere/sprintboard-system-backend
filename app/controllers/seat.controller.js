const db = require("../models");
const Seat = db.seat;
const Op = db.Sequelize.Op;

// Create and Save an seat
exports.create = async (req, res) => {
  if (req.body.seatNumber === undefined) {
    const error = new Error("seatNumber cannot be empty for seat!");
    error.statusCode = 400;
    throw error;
  } else if (req.body.seatNumber < 1 || req.body.seatNumber > 10) {
    const error = new Error("seatNumber must be between 1 and 10!");
    return res.status(400).send({
      message: error.message,
    });
  } else if (req.body.rowNumber == undefined) {
    const error = new Error("rowNumber cannot be empty for seat");
    error.statusCode = 400;
    throw error;
  } else if (req.body.seatStatus == undefined) {
    const error = new Error("seatStatus cannot be empty for seat!" + req.body);
    error.statusCode = 400;
    throw error;
  } else if (req.body.isHandicap == undefined) {
    const error = new Error("isHandicap cannot be empty for seat!");
    error.statusCode = 400;
    throw error;
  }

  const seat = {
    seatNumber: req.body.seatNumber,
    rowNumber: req.body.rowNumber,
    seatStatus: req.body.seatStatus ,
    isHandicap: req.body.isHandicap,
  };

  try {
    const data = await Seat.create(seat);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Seat.",
    });
  }
};

// Retrieve all Seats from the database
exports.findAll = async (req, res) => {
  try {
    const data = await Seat.findAll({
      order: [
        ["rowNumber", "ASC"],
        ["seatNumber", "ASC"]
      ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving seats.",
    });
  }
};

// Find a single Seat with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Seat.findByPk(id, {
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Seat with id=" + id,
    });
  }
};

// Update an Seat by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  if (req.body.seatNumber !== undefined && ((req.body.seatNumber < 1 || req.body.seatNumber > 10))) {
    const error = new Error("seatNumber must be between 1 and 10!");
    return res.status(400).send({
      message: error.message || "Error updating Seat with id=" + id,
    });
  }

  try {
    const num = await Seat.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({ message: "Seat was updated successfully." });
    } else {
      res.send({
        message: `Cannot update Seat with id=${id}. Maybe Seat was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Seat with id=" + id,
    });
  }
};


// Delete an Seat with the specified id
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await Seat.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({ message: "Seat was deleted successfully!" });
    } else {
      res.send({
        message: `Cannot delete Seat with id=${id}. Maybe Seat was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Seat with id=" + id,
    });
  }
};

// Delete all Seats from the database
exports.deleteAll = async (req, res) => {
  try {
    const number = await Seat.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Seats were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all seats.",
    });
  }
};

