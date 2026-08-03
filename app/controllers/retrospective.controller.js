const db = require("../models");
const Retro = db.retrospective;
const User = db.user;
const Op = db.Sequelize.Op;
const UserActivityLog = db.userActivityLog;
const { LogActions } = require("../config/userActivityLogActions");

// Create and Save a Retro
exports.create = async (req, res) => {
  // Validate request
  if (req.body.title === undefined) {
    return res.status(400).send({
      message: "title cannot be empty for retro!",
    });
  }
  if (req.body.status === undefined) {
    return res.status(400).send({
      message: "status cannot be empty for retro!",
    });
  }
  if (req.body.sprintId === undefined) {
    return res.status(400).send({
      message: "sprintId cannot be empty for retro!",
    });
  }

  // Create a Retro
  const retro = {
    title: req.body.title,
    status: req.body.status,
    sprintId: req.body.sprintId,
    completionDate: req.body.completionDate ?? null
  };

  try {
    const data = await Retro.create(retro);
    const requestedById = req.userId;
    const sprint = await db.sprint.findByPk(retro.sprintId);

    // Log the action to the user activity log
    try {
      await UserActivityLog.create({
        userId: requestedById,
        action: LogActions.RETRO_CREATED,
        detail: ` created a retro for ${sprint.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (error) {
      console.log("Error writing RETRO_CREATED action to User Activity Log: ", error);
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Retro.",
    });
  }
};

// Retrieve all Retros
// Retrieve all Retros (with related info for the retro cards)
exports.findAll = async (req, res) => {
  const title = req.query.title;
  var condition = title
    ? { title: { [Op.like]: `%${title}%` } }
    : null;

  try {
    const data = await Retro.findAll({
      where: condition,
      include: [
        {
          model: db.sprint,
          as: "sprint",
          attributes: ["id", "name"],
        },
        {
          model: db.retroItem,
          as: "retrospectiveItems",
          include: [
                  {
                    model: db.user,
                    as: "user",
                    attributes: ["id", "email"],
                  },
                ]
        },
      ]
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving retros.",
    });
  }
};

// Find a single Retro with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Retro.findByPk(id, {
      include: [
        {
          model: db.sprint,
          as: "sprint",
          attributes: ["id", "name"],
        },
        {
          model: db.retroItem,
          as: "retrospectiveItems",
          include: [
                  {
                    model: db.user,
                    as: "user",
                    attributes: ["id", "email"],
                  },
                ]
        },
      ]
            });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Retro with id=" + id,
    });
  }
};

// Find all retros associated with a user
exports.findSprintRetro = async (req, res) => {
  const sprintId = req.params.sprintId;

  try {
    const data = await Retro.findOne({
      where: {
        sprintId: sprintId,
      },
      include: [
        {
          model: db.sprint,
          as: "sprint",
          attributes: ["id", "name"],
        },
        {
          model: db.retroItem,
          as: "retrospectiveItems",
          include: [
                  {
                    model: db.user,
                    as: "user",
                    attributes: ["id", "email"],
                  },
                ]
        },
      ],
    });

    if (!data) {
      return res.status(404).send({ message: "Retro(s) not found." });
    }

    res.status(200).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving retro for sprint with id= " + sprintId,
    });
  }
};

// Update a Retro by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Retro.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "Retro was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update Retro with id=${id}. Maybe Retro was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Retro with id=" + id,
    });
  }
};

// Delete a Retro with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await Retro.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "Retro was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete Retro with id=${id}. Maybe Retro was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Retro with id=" + id,
    });
  }
};

// Delete all Retros from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await Retro.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Retros were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all retros.",
    });
  }
};