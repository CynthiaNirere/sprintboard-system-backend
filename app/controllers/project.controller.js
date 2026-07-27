const db = require("../models");
const Project = db.project;
const Op = db.Sequelize.Op;

// Create and Save a Project
exports.create = async (req, res) => {
  // Validate request
  if (req.body.name === undefined) {
    return res.status(400).send({
      message: "Name cannot be empty for project!",
    });
  }

  // Create a Project
  const project = {
    name: req.body.name,
    description: req.body.description,
    createdBy: req.userId,
  };

  try {
    const data = await Project.create(project);

    // "No Status" is what a new ticket defaults into.
    await db.boardStatus.create({
      name: "No Status",
      columnOrder: 1,
      projectId: data.id,
    });

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Project.",
    });
  }
};

// Retrieve all Projects
// Retrieve all Projects (with related info for the project cards)
exports.findAll = async (req, res) => {
  const name = req.query.name;
  var condition = name
    ? { name: { [Op.like]: `%${name}%` } }
    : null;

  try {
    const data = await Project.findAll({
      where: condition,
      include: [
        {
          model: db.sprint,
          as: "projectSprints",
          attributes: ["id", "name", "isActive"],
        },
        {
          model: db.ticket,
          as: "projectTickets",
          attributes: ["id"],
        },
        {
          model: db.boardStatus,
          as: "projectBoardStatuses",
          attributes: ["name", "columnOrder"],
        },
       {
        model: db.githubRepository,
        as: "projectRepositories",
        attributes: ["id", "name", "url"],
        },
      ],
      order: [["name", "ASC"]],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving projects.",
    });
  }
};

// Find a single Project with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Project.findByPk(id, {
      include: [
        { model: db.boardStatus, as: "projectBoardStatuses", attributes: ["name", "columnOrder"] },
        { model: db.githubRepository, as: "projectRepositories", attributes: ["id", "name"] },
        ],
            });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Project with id=" + id,
    });
  }
};

// Update a Project by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Project.update(req.body, {
      where: { id: id },
    });
    if (num == 1) {
      res.send({
        message: "Project was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update Project with id=${id}. Maybe Project was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating Project with id=" + id,
    });
  }
};

// Delete a Project with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await Project.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "Project was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete Project with id=${id}. Maybe Project was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete Project with id=" + id,
    });
  }
};

// Delete all Projects from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await Project.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Projects were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all projects.",
    });
  }
};