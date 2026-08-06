const db = require("../models");
const { authenticate } = require("../authentication/authentication");
const User = db.user;
const Project = db.project;
const Session = db.session;
const Op = db.Sequelize.Op;
const { encrypt, decrypt, getSalt, hashPassword } = require("../authentication/crypto");
const UserActivityLog = db.userActivityLog;
const { LogActions } = require("../config/userActivityLogActions");

// Create and Save a new User (registration)
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.firstName) {
    return res.status(400).send({
      message: "First name cannot be empty for user!"
    });
  } else if (!req.body.lastName) {
    return res.status(400).send({
      message: "Last name cannot be empty for user!"
    });
  } else if (!req.body.username) {
    return res.status(400).send({
      message: "Username cannot be empty for user!"
    });
  } else if (!req.body.email) {
    return res.status(400).send({
      message: "Email cannot be empty for user!"
    });
  } else if (!req.body.password) {
    return res.status(400).send({
      message: "Password cannot be empty for user!"
    });
  }

  try {
    const data = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (data) {
      return res.status(400).send({ message: "This email is already in use." });
    }

    let salt = await getSalt();
    let hash = await hashPassword(req.body.password, salt);

    // Create a User — role is always USER
    const user = {
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash,
      salt: salt,
      globalRole: 'USER',
      githubAccount: req.body.githubAccount || null,
    };

    try {
      const createdUser = await User.create(user);
      let userId = createdUser.id;

      let expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + 1);

      const session = {
        email: req.body.email,
        userId: userId,
        expirationDate: expireTime,
      };

      const sessionData = await Session.create(session);
      let sessionId = sessionData.id;
      let token = await encrypt(sessionId);

      let userInfo = {
        id: createdUser.id,
        username: createdUser.username,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        email: createdUser.email,
        githubAccount: createdUser.githubAccount,
        globalRole: createdUser.globalRole,
        token: token,
        sessionExpireDate: session.expirationDate,
      };

      // Log the action to the user activity log
      try {
        let auth = req.get("authorization");
        let loggedUserId = null;
        let loggedDetail = "";

        if (auth != null && auth.startsWith("Bearer")) {
          let token = auth.slice(7);
          let sessionId = await decrypt(token);
          if (sessionId != null) {
            const adminSession = await Session.findByPk(sessionId);

            if (adminSession) {
              loggedUserId = adminSession.userId;
              loggedDetail = ` created a new user account for ${userInfo.firstName} ${userInfo.lastName}`;
            }
          }
        }

        if (!loggedUserId) {
          loggedUserId = userId;
          loggedDetail = ` created a new account.`;
        }     

        await UserActivityLog.create({
          userId: loggedUserId,
          action: LogActions.USER_CREATED,
          detail: loggedDetail,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing USER_CREATED action to User Activity Log: ", error);
      }

      res.send(userInfo);
    } catch (err) {
      console.log(err);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving User with email=" + req.body.email
    });
  }
};

// Retrieve all Users from the database.
exports.findAll = async (req, res) => {
  const id = req.query.id;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : null;

  try {
    const data = await User.findAll({
      where: condition,
      attributes: { exclude: ["password", "salt"] },
    });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving users.",
    });
  }
};

// Find a single User with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

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

// Confirms a GitHub username is both correctly formatted and belongs to a
// real, existing account.
async function verifyGithubAccount(username) {
  const validFormat = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/.test(username);
  if (!validFormat) return false;

  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    return response.ok;
  } catch (error) {
    // If GitHub itself is unreachable, don't block the update on that —
    // the format already checked out, so let it through.
    console.log("Could not reach GitHub to verify account:", error);
    return true;
  }
}

// Update a User by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  const requestedById = req.userId;

  const { username, firstName, lastName, email, githubAccount, globalRole } = req.body;
  const updateData = { username, firstName, lastName, email, githubAccount, globalRole };
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  try {
    // Verify the GitHub account, if one was provided.
    if (updateData.githubAccount) {
      const isValidGithub = await verifyGithubAccount(updateData.githubAccount);
      if (!isValidGithub) {
        return res.status(400).send({
          message: `"${updateData.githubAccount}" doesn't look like a real GitHub account.`,
        });
      }
    }

    // Check if only 1 global role of "ADMIN" remains in the app, prevent the last occurrence of Admin being updated to "USER"
    if (updateData.globalRole === "USER") {
      try {
        const userToUpdate = await User.findByPk(id);

        if (userToUpdate.globalRole === "ADMIN") {
          const usersWithAdminCount = await User.count({
            where: {
              globalRole: "ADMIN"
            }
          });

          if (usersWithAdminCount <= 1) {
            return res.status(400).send({
              message: "Cannot update global role of ADMIN to USER. The workspace must have at least one active Admin."
            });
          }
        }
      } catch (adminError) {
          console.log("Error! Cannot update last remaining Admin role to User: ", adminError);
          return res.status(500).send({ message: "Error updating global role of ADMIN to USER."});
      }
    }

    const number = await User.update(updateData, {
      where: { id: id },
    });
    if (number == 1) {
      // Only log a role change if globalRole was actually part of this
      if (updateData.globalRole) {
        let formattedGlobalRole = updateData.globalRole.toLowerCase();
        formattedGlobalRole = formattedGlobalRole.charAt(0).toUpperCase() + formattedGlobalRole.substring(1);

        try {
          await UserActivityLog.create({
            userId: requestedById,
            action: LogActions.GLOBAL_ROLE_CHANGED,
            detail: ` changed ${firstName} ${lastName}'s global role to ${formattedGlobalRole}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
        } catch (error) {
          console.log("Error writing GLOBAL_ROLE_CHANGED action to User Activity Log: ", error);
        }
      }

      res.send({
        message: "User was updated successfully.",
      });
    } else {
      res.send({
        message: `Cannot update User with id = ${id}. Maybe User was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error updating User with id =" + id,
    });
  }
};

// Delete a User with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const number = await User.destroy({
      where: { id: id },
    });
    if (number == 1) {
      res.send({
        message: "User was deleted successfully!",
      });
    } else {
      res.send({
        message: `Cannot delete User with id = ${id}. Maybe User was not found!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Could not delete User with id = " + id,
    });
  }
};

// Delete all Users from the database.
exports.deleteAll = async (req, res) => {
  try {
    const number = await User.destroy({
      where: {},
      truncate: false,
    });
    res.send({ message: `${number} Users were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message:
        err.message || "Some error occurred while removing all users.",
    });
  }
};