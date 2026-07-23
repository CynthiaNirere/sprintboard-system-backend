const db = require("../models");
const User = db.user;
const Project = db.project;
const ProjectMember = db.projectMember;
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

// Find all members associated with a project with an id
exports.findProjectMembers = async (req, res) => {
  const projectId = req.params.id;
  
  try {
    const data = await Project.findByPk(projectId, {
      include: [
        {
          model: User, 
          as: "users",
          attributes: [ "id", "firstName", "lastName", "globalRole" ],
          through: {
            attributes: [ "projectRole" ]
          }
        }
      ],
    });

    if (!data) {
      return res.status(404).send({ message: "Project not found." });
    }

    res.status(200).send(data.users);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving members associated with Project " + projectId,
    });
  }
};

// Add a user to the Project Members junction table
exports.addProjectMember = async (req, res) => {
  const projectId = req.params.id;
  try {
    const userId = req.body.userId;
    const projectRole = req.body.projectRole;

    if (!userId) {
      return res.status(400).send({ message: "User ID was not included in request!" });
    }

    const newProjectMember = {
      projectId: projectId,
      userId: userId,
      projectRole: projectRole
    };

    try {
      const data = await ProjectMember.create(newProjectMember);
      res.status(201).send(data);
    } catch (err) {
      res.status(500).send({
        message: err.message || "An error occurred creating the project member",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error adding user to project " + projectId,
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

// Update a user in the Project Members junction table
exports.updateProjectMember = async (req, res) => {
  const projectId = req.params.id;

  try {
    const userId = req.body.userId;
    const projectRole = req.body.projectRole;

    if (!userId || !projectRole) {
      return res.status(400).send({ message: "User ID or project role was not included in request!" });
    }

    const num = await ProjectMember.update(req.body, {
      where: {
        projectId: projectId,
        userId: userId
      },
    });
    if (num == 1) {
      res.status(200).send({
        message: "Project role was updated successfully!",
      });
    } else {
      res.status(404).send({
        message: `Cannot update project role with userId=${userId}.`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating project role in Project " + projectId,
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

// Delete a user from the Project Members junction table
exports.deleteProjectMember = async (req, res) => {
  const projectId = req.params.id;
  const userId = req.params.userId;

  try {
    const num = await ProjectMember.destroy({
      where: {
        projectId: projectId,
        userId: userId
      },
    });

    if (num == 1) {
      res.status(200).send({
        message: "Project member was deleted successfully!",
      });
    } else {
      res.status(404).send({
        message: `Cannot delete project member with projectId=${projectId} and userId=${userId}.`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || `Could not delete project member with projectId=${projectId} and userId=${userId}.`,
    });
  }
};