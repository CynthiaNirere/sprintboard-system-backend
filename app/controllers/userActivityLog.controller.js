const db = require("../models");
const UserActivityLog = db.userActivityLog;
const { LogActionValue } = require("../config/userActivityLogActions");

// Create and Save a new User Activity Log entry
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.userId) {
    return res.status(400).send({
      message: "UserId cannot be empty for user activity log!"
    });
  } else if (!req.body.action) {
    return res.status(400).send({
      message: "Action cannot be empty for user activity log!"
    });
  } else if (!LogActionValue.includes(req.body.action)) {
    return res.status(400).send({
      message: "User Activity Log action is invalid!"
    });
  } else if (!req.body.detail) {
    return res.status(400).send({
      message: "Detail cannot be empty for user activity log!"
    });
  }

  try {
    // Create a user activity log entry 
    const userActivityLogEntry = {
      userId: req.body.userId,
      action: req.body.action,
      detail: req.body.detail,
      ipAddress: req.body.ipAddress || null,
      userAgent: req.body.userAgent || null,
    };

    const createdLog = await UserActivityLog.create(userActivityLogEntry);
    res.send(createdLog);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred during creation of user activity log.",
    });
  }
};

// Retrieve all Users from the database.
exports.findAll = async (req, res) => {
  try {
    const data = await UserActivityLog.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving the user activity logs.",
    });
  }
};

// Find a single user activity log entry with an id
exports.findOne = async (req, res) => {
  const userId = req.params.id;

  try {
    const data = await User.findByPk(id, {
      attributes: { exclude: ["password", "salt"] },
      include: [{model: db.project, include: [{model:db.sprint, as: "projectSprints"}]}],
    });
    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `Cannot find User with id = ${id}.`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving User with id = " + id,
    });
  }
};

// Find a single User with an email
exports.findByEmail = async (req, res) => {
  const email = req.params.email;

  try {
    const data = await User.findOne({
      where: {
        email: email,
      },
      attributes: { exclude: ["password", "salt"] },
    });
    if (data) {
      res.send(data);
    } else {
      res.status(404).send({ message: "not found" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving User with email=" + email,
    });
  }
};