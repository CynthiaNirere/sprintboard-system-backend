const db = require("../models");
const Show = db.show;
const Op = db.Sequelize.Op;

// Create and Save a show
exports.create = async (req, res) => {
  // Validate request
  if (req.body.title === undefined) {
    const error = new Error("Title cannot be empty for show!");
    error.statusCode = 400;
    throw error;
  } 

  // Create a show
  const show = {
    title: req.body.title,
    description: req.body.description,
    speakerInfo: req.body.speakerInfo,
    price: req.body.price,
  };
  // Save show in the database
  try {
    const data = await Show.create(show);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Show.",
    });
  }
};

// Retrieve all Shows from the database.
exports.findAll = async (req, res) => {
  const title = req.query.title;
  var condition = title
    ? {
        id: {
          [Op.like]: `%${title}%`,
        },
      }
    : null;

  try {
    const data = await Show.findAll({ where: condition, order: [["title", "ASC"]] });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving shows.",
    });
  }
};

// Find a single Show with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Show.findByPk(id);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Show with id=" + id,
    });
  }
};

// Update a Show by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Show.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "Show was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update Show with id=${id}. Maybe Show was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Show with id=" + id,
    });
  }
};

// Delete a Show with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await Show.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "Show was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete Show with id=${id}. Maybe Show was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Show with id=" + id,
    });
  }
};

// Delete all Shows from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await Show.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Shows were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while removing all shows.",
    });
  }
};
