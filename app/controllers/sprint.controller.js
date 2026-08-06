const db = require("../models");
const Sprint = db.sprint;
const Op = db.Sequelize.Op;
const UserActivityLog = db.userActivityLog;
const { LogActions } = require("../config/userActivityLogActions");

// Create and Save a Sprint
exports.create = async (req, res) => {
  // Validate request
  if (req.body.name === undefined) {
    const error = new Error("Name cannot be empty for sprint!");
    error.statusCode = 400;
    throw error;
  } else if (req.body.startDate === undefined) {
    const error = new Error("Start date cannot be empty for sprint!");
    error.statusCode = 400;
    throw error;
  } else if (req.body.endDate === undefined) {
    const error = new Error("End date cannot be empty for sprint!");
    error.statusCode = 400;
    throw error;
  } else if (req.body.projectId === undefined) {
    const error = new Error("Project id cannot be empty for sprint!");
    error.statusCode = 400;
    throw error;
  }

  // Create a Sprint
  const sprint = {
    name: req.body.name,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    isActive: req.body.isActive ?? true,
    projectId: req.body.projectId,
  };

  try {
    const data = await Sprint.create(sprint);
    const requestedById = req.userId;

    // Log the action to the user activity log
    try {
      await UserActivityLog.create({
        userId: requestedById,
        action: LogActions.SPRINT_CREATED,
        detail: ` created sprint ${sprint.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (error) {
      console.log("Error writing SPRINT_CREATED action to User Activity Log: ", error);
    }

    res.send(data);
  } catch (err) {
    res.status(400).send({
      message: err.message || "Some error occurred while creating the Sprint.",
    });
  }
};

// Create recurring sprints (e.g. eight 2-week sprints in one call)
exports.createRecurring = async (req, res) => {
  const { name, startDate, lengthDays, count, projectId } = req.body;

  if (!name || !startDate || !lengthDays || !count || !projectId) {
    return res.status(400).send({
      message: "name, startDate, lengthDays, count, and projectId are required!",
    });
  }

  const sprints = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const end = new Date(current);
    end.setDate(end.getDate() + lengthDays - 1);

    sprints.push({
      name: `${name} ${i + 1}`,
      startDate: current.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      isActive: true,
      projectId: projectId,
    });

    current = new Date(end);
    current.setDate(current.getDate() + 1);
  }

  try {
    const data = await Sprint.bulkCreate(sprints,{individualHooks: true});
    const requestedById = req.userId;

    // Log the action to the user activity log
    try {
      await UserActivityLog.create({
        userId: requestedById,
        action: LogActions.SPRINT_CREATED,
        detail: ` created recurring sprints for ${name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (error) {
      console.log("Error writing SPRINT_CREATED action to User Activity Log: ", error);
    }

    res.send(data);
  } catch (err) {
    res.status(400).send({
      message: err.message || "Some error occurred while creating recurring Sprints.",
    });
  }
};

// Retrieve all Sprints (optionally filtered by project)
exports.findAll = async (req, res) => {
  const projectId = req.query.projectId;
  var condition = projectId ? { projectId: projectId } : null;

  try {
    const data = await Sprint.findAll({
      where: condition,
      include: [
              {
                model: db.retrospective,
                as: "sprintRetrospective",
                include: [
                   {
                    model: db.retroItem,
                    as: "retrospectiveItems",
                    include: [
                      {
                        model: db.user,
                        as: "user",
                        attributes: ["id", "email"]
                      },
                    ]
                  }
                ]
              },
             
            ],
      order: [["startDate", "ASC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving sprints.",
    });
  }
};

// Find a single Sprint with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await Sprint.findByPk(id,{
      include: [
              {
                model: db.retrospective,
                as: "sprintRetrospective",
                include: [
                   {
                    model: db.retroItem,
                    as: "retrospectiveItems",
                    include: [
                      {
                        model: db.user,
                        as: "user",
                        attributes: ["id", "email"]
                      },
                    ]
                  }
                ]
              },
             
            ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Sprint with id=" + id,
    });
  }
};

// Update a Sprint by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  const sprint = await Sprint.findByPk(id);

  try {
    const num = await Sprint.update(req.body, {
      where: { id: id },
      individualHooks: true
    });
      const requestedById = req.userId;

      // Log the action to the user activity log
      try {
        await UserActivityLog.create({
          userId: requestedById,
          action: LogActions.SPRINT_UPDATED,
          detail: ` updated sprint ${sprint.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing SPRINT_UPDATED action to User Activity Log: ", error);
      }

    res.send({
      message: "Sprint was updated successfully.",
    });

  } catch (err) {
    res.status(400).send({
      message: err.message || "Error updating Sprint with id=" + id,
    });
  }
};

// Delete a Sprint with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;
  const sprint = await Sprint.findByPk(id);

  try {
    const number = await Sprint.destroy({
      where: { id: id },
    });
    if (number == 1) {
      const requestedById = req.userId;

      // Log the action to the user activity log
      try {
        await UserActivityLog.create({
          userId: requestedById,
          action: LogActions.SPRINT_DELETED,
          detail: ` deleted sprint ${sprint.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing SPRINT_DELETED action to User Activity Log: ", error);
      }

      res.send({
        message: "Sprint was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete Sprint with id=${id}. Maybe Sprint was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Sprint with id=" + id,
    });
  }
};

// Delete all Sprints from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await Sprint.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Sprints were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all sprints.",
    });
  }
};