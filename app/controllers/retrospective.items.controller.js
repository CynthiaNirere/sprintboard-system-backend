const db = require("../models");
const RetroItem = db.retroItem;
const Retro = db.retrospective;
const User = db.user;
const Op = db.Sequelize.Op;

// Create and Save a RetroItem
exports.create = async (req, res) => {
  // Validate request
  if (req.body.itemType === undefined) {
    return res.status(400).send({
      message: "itemType cannot be empty for retroItem!",
    });
  }
  if (req.body.content === undefined) {
    return res.status(400).send({
      message: "content cannot be empty for retroItem!",
    });
  }
  if (req.body.userId === undefined) {
    return res.status(400).send({
      message: "userId cannot be empty for retroItem!",
    });
  }
  if (req.body.retroId === undefined) {
    return res.status(400).send({
      message: "retroId cannot be empty for retroItem!",
    });
  }

  // Create a RetroItem
  const retroItem = {
    itemType: req.body.itemType,
    content: req.body.content,
    userId: req.body.userId,
    retroId: req.body.retroId
  };

  try {
    const data = await RetroItem.create(retroItem);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the RetroItem.",
    });
  }
};

// Retrieve all RetroItems
// Retrieve all RetroItems (with related info for the retroItem cards)
exports.findAll = async (req, res) => {
  const title = req.query.title;
  var condition = title
    ? { title: { [Op.like]: `%${title}%` } }
    : null;

  try {
    const data = await RetroItem.findAll({
      where: condition,
      include: [
        {
          model: db.user,
          as: "user",
          attributes: ["id", "email"],
        },
      ]
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving retroItems.",
    });
  }
};

// Find a single RetroItem with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await RetroItem.findByPk(id, {
      include: [
        {
          model: db.user,
          as: "user",
          attributes: ["id", "email"],
        },
      ]
            });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving RetroItem with id=" + id,
    });
  }
};

// Find all retroItems associated with a user
exports.findRetroItem = async (req, res) => {
  const retroId = req.params.retroId;

  try {
    const data = await RetroItem.findAll({
      where: {
        retroId: retroId,
      },
      include: [
        {
          model: db.user,
          as: "user",
          attributes: ["id", "email"],
        },
      ]
    });

    if (!data) {
      return res.status(404).send({ message: "RetroItem(s) not found." });
    }

    res.status(200).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving retroItem with id= " + retroId,
    });
  }
};

// Update a RetroItem by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await RetroItem.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "RetroItem was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update RetroItem with id=${id}. Maybe RetroItem was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating RetroItem with id=" + id,
    });
  }
};

// Delete a RetroItem with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await RetroItem.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "RetroItem was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete RetroItem with id=${id}. Maybe RetroItem was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete RetroItem with id=" + id,
    });
  }
};

// Delete all RetroItems from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await RetroItem.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} RetroItems were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all retroItems.",
    });
  }
};