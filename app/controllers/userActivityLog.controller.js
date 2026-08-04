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

// Retrieve all user activity logs from the database.
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