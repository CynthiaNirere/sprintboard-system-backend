const db = require("../models");
const User = db.user;
const Project = db.project;
const ProjectMember = db.projectMember;
const Op = db.Sequelize.Op;
const UserActivityLog = db.userActivityLog;
const { LogActions } = require("../config/userActivityLogActions");

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

    // Log the action to the user activity log
    try {
      const user = await User.findByPk(req.userId);

      await UserActivityLog.create({
        userId: req.userId,
        action: LogActions.PROJECT_CREATED,
        detail: ` created project ${data.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (error) {
      console.log("Error writing PROJECT_CREATED action to User Activity Log: ", error);
    }

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
          attributes: ["id", "name", "isActive", "startDate", "endDate"],
        },
        {
          model: db.ticket,
          as: "projectTickets",
          attributes: ["id"],
        },
        {
          model: db.boardStatus,
          as: "projectBoardStatuses",
          attributes: ["id", "name", "columnOrder"],
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
        { model: db.boardStatus, as: "projectBoardStatuses", attributes: ["id", "name", "columnOrder"] },
        { model: db.githubRepository, as: "projectRepositories", attributes: ["id", "name"] },
        { model: db.sprint, as: "projectSprints", attributes: ["id", "name", "isActive"] },
      ],
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving Project with id=" + id,
    });
  }
};

// Find all projects associated with a user
exports.findUserProjects = async (req, res) => {
  const userId = req.params.userId;

  try {
    const data = await Project.findAll({
      include: [
        {
          model: User, 
          as: "users",
          where: {
            id: userId
          },
          attributes: ["id"],
          through: {
            attributes: [ "projectRole" ]
          }
        },
        {
          model: db.sprint,
          as: "projectSprints",
          attributes: ["id", "name", "isActive", "startDate", "endDate"],
        },
        {
          model: db.ticket,
          as: "projectTickets",
          attributes: ["id"],
        },
        {
          model: db.boardStatus,
          as: "projectBoardStatuses",
          attributes: ["id", "name", "columnOrder"],
        },
        {
          model: db.githubRepository,
          as: "projectRepositories",
          attributes: ["id", "name", "url"],
        },
      ],
      order: [["name", "ASC"]],
    });

    if (!data) {
      return res.status(404).send({ message: "Project(s) not found." });
    }

    res.status(200).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving projects associated with user " + userId,
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
  const projectId = req.params.projectId;
  
  try {
    const userId = req.body.userId;
    const projectRole = req.body.projectRole;

    if (!userId || !projectRole) {
      return res.status(400).send({ message: "userId or projectRole was missing in the request!" });
    }

    const existingProjectMember = await ProjectMember.findOne({
      where: {
        projectId: projectId,
        userId: userId
      }
    });

    if (existingProjectMember) {
      return res.status(400).send({
        message: "This user is already a member of this project."
      });
    }

    const newProjectMember = {
      projectId: projectId,
      userId: userId,
      projectRole: projectRole
    };

    try {
      const data = await ProjectMember.create(newProjectMember);
      const project = await Project.findByPk(projectId);
      const addedMember = await User.findByPk(userId);
      const currentUser = await User.findByPk(req.userId);

      // Log the action to the user activity log
      try {
        await UserActivityLog.create({
          userId: currentUser.id,
          action: LogActions.MEMBER_ADDED,
          detail: ` added ${addedMember.firstName} ${addedMember.lastName} to ${project.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing MEMBER_ADDED action to User Activity Log: ", error);
      }

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
  const projectId = req.params.projectId;
  const userId = req.body.userId;
  const projectRole = req.body.projectRole;
  const requestedById = req.userId;

  if (!userId || !projectRole) {
    return res.status(400).send({ message: "userId or projectRole was missing in the request!" });
  }

  try {
    const userToUpdate = await ProjectMember.findOne({
      where: {
        projectId: projectId,
        userId: userId
      }
    });

    if (!userToUpdate) {
      return res.status(404).send({ message: "Project member not found." });
    }

    const requestingUser = await User.findByPk(requestedById);
    if (requestingUser.globalRole !== "ADMIN") {
      if (userId === requestedById) {
        return res.status(403).send({ message: "Access denied. Project Admins cannot update their own roles." });
      }
      if (userToUpdate.projectRole === "PROJECT_ADMIN") {
        return res.status(403).send({ message: "Access denied. Only Admins can update other Project Admins." });
      }
    }

    const [num] = await ProjectMember.update(
      { projectRole: projectRole },
      {
        where: {
          projectId: projectId,
          userId: userId
      },
    });

    if (num == 1 || num == 0) {
      // Log the action to the user activity log
      try {
        const project = await Project.findByPk(projectId);
        const updatedUser = await User.findByPk(userId);

        const formattedRole = () => {
          let splitString = projectRole.toLowerCase().split('_');
          for (let i = 0; i < splitString.length; i++) {
            splitString[i] = splitString[i].charAt(0).toUpperCase() + splitString[i].substring(1);
          }
          return splitString.join(' ');
        }

        await UserActivityLog.create({
          userId: requestedById,
          action: LogActions.PROJECT_ROLE_CHANGED,
          detail: ` changed ${updatedUser.firstName} ${updatedUser.lastName}'s project role to ${formattedRole()} on ${project.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing PROJECT_ROLE_CHANGED action to User Activity Log: ", error);
      }

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
      message: err.message || `Error updating project role for user ${userId} in project ${projectId}.`,
    });
  }
};

// Delete a Project with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;
  const project = await Project.findByPk(id);
  const user = await User.findByPk(req.userId);

  try {
    const number = await Project.destroy({
      where: { id: id },
    });
    if (number == 1) {
      // Log the action to the user activity log
      try {
        await UserActivityLog.create({
          userId: user.id,
          action: LogActions.PROJECT_DELETED,
          detail: ` deleted project ${project.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing PROJECT_DELETED action to User Activity Log: ", error);
      }

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
  const projectId = req.params.projectId;
  const userId = req.params.userId;
  const requestedById = req.userId;

  try {
    const userToDelete = await ProjectMember.findOne({
      where: {
        projectId: projectId,
        userId: userId
      }
    });

    if (!userToDelete) {
      return res.status(404).send({ message: "Project member not found." });
    }

    if (userToDelete.projectRole === "PROJECT_ADMIN") {
      const requestingUser = await User.findByPk(requestedById);
      if (requestingUser.globalRole !== "ADMIN") {
        return res.status(403).send({ message: "Access denied. Only Admins can delete Project Admins." });
      }
    }

    const num = await ProjectMember.destroy({
      where: {
        projectId: projectId,
        userId: userId
      },
    });

    if (num == 1) {
      // Log the action to the user activity log
      try {
        const project = await Project.findByPk(projectId);
        const deletedMember = await User.findByPk(userId);

        await UserActivityLog.create({
          userId: requestedById,
          action: LogActions.MEMBER_REMOVED,
          detail: ` removed ${deletedMember.firstName} ${deletedMember.lastName} from ${project.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing MEMBER_REMOVED action to User Activity Log: ", error);
      }    

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