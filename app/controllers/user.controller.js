const db = require("../models");
const { authenticate } = require("../authentication/authentication");
const { authenticate } = require("../authentication/authentication");
const User = db.user;
const Project = db.project;
const Session = db.session;
const Op = db.Sequelize.Op;
const { encrypt, decrypt, getSalt, hashPassword } = require("../authentication/crypto");
const { encrypt, decrypt, getSalt, hashPassword } = require("../authentication/crypto");
const UserActivityLog = db.userActivityLog;
const { LogActions } = require("../config/userActivityLogActions");
const github = require("../services/github.service");

// Shapes a GitHub personal access token can take: classic (ghp_/gho_/ghu_/
// ghs_/ghr_), fine-grained (github_pat_), or a legacy 40-char hex token.
const GITHUB_PAT_PATTERN =
  /^(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|[a-f0-9]{40})$/;

/**
 * Turns a client-supplied githubToken into the columns to persist.
 *
 * Returns { fields } on success, or { error: { status, message } } for the
 * caller to send straight back. A null token clears the stored one; anything
 * else is shape-checked and verified against GitHub before being encrypted, so
 * a typo or a revoked token is caught now rather than when someone moves a
 * ticket.
 */
const resolveGithubToken = async (rawToken) => {
  if (rawToken === null) {
    return { fields: { githubToken: null, githubTokenUpdatedAt: null } };
  }

  if (typeof rawToken !== "string" || rawToken.trim() === "") {
    return { error: { status: 400, message: "githubToken cannot be empty!" } };
  }

  const trimmed = rawToken.trim();
  if (!GITHUB_PAT_PATTERN.test(trimmed)) {
    return {
      error: {
        status: 400,
        message: "That does not look like a GitHub personal access token.",
      },
    };
  }

  let login;
  try {
    const result = await github.validateToken(trimmed);
    login = result.login;
  } catch (err) {
    if (err.code === "BAD_TOKEN") {
      return { error: { status: 400, message: "GitHub rejected this token." } };
    }
    if (err.code === "RATE_LIMITED") {
      return {
        error: {
          status: 503,
          message: "GitHub is rate limiting requests. Try again shortly.",
        },
      };
    }
    return {
      error: { status: 502, message: "Could not reach GitHub to verify the token." },
    };
  }

  const fields = {
    githubToken: await encrypt(trimmed),
    githubTokenUpdatedAt: new Date(),
  };
  // The verified login is more trustworthy than whatever the client typed.
  if (login) fields.githubAccount = login;

  return { fields: fields };
};

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

    // A GitHub token is optional at registration. Resolve it before creating
    // anything so a bad token cannot leave a half-registered user behind.
    let githubFields = { githubToken: null, githubTokenUpdatedAt: null };
    if (req.body.githubToken !== undefined && req.body.githubToken !== null) {
      const resolved = await resolveGithubToken(req.body.githubToken);
      if (resolved.error) {
        return res.status(resolved.error.status).send({ message: resolved.error.message });
      }
      githubFields = resolved.fields;
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
      githubToken: githubFields.githubToken ?? null,
      githubTokenUpdatedAt: githubFields.githubTokenUpdatedAt ?? null,
    };
    // A verified GitHub login beats whatever the client typed.
    if (githubFields.githubAccount) user.githubAccount = githubFields.githubAccount;

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
      attributes: { exclude: ["password", "salt", "githubToken"] },
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
      attributes: { exclude: ["password", "salt", "githubToken"] },
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
      attributes: { exclude: ["password", "salt", "githubToken"] },
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

  const { username, firstName, lastName, email, githubAccount, globalRole, githubToken } = req.body;
  const updateData = { username, firstName, lastName, email, githubAccount, globalRole, githubToken };
  // Strips absent fields but keeps an explicit null, which is what lets
  // githubToken: null clear a stored token.
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  // Swap the raw token for the columns to persist before it reaches the DB.
  if (updateData.githubToken !== undefined) {
    const resolved = await resolveGithubToken(updateData.githubToken);
    if (resolved.error) {
      return res.status(resolved.error.status).send({ message: resolved.error.message });
    }
    delete updateData.githubToken;
    Object.assign(updateData, resolved.fields);
  }

  try {
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
        // Not every update carries a globalRole — an update that only changes,
      // say, the GitHub token must not blow up here.
      let formattedGlobalRole = (updateData.globalRole || "").toLowerCase();
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

// Report whether a user has a GitHub token on file. Never decrypts it and
// never calls GitHub.
exports.getGithubTokenStatus = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await User.scope("withGithubToken").findByPk(id, {
      attributes: ["id", "githubAccount", "githubToken", "githubTokenUpdatedAt"],
    });
    if (!data) {
      return res.status(404).send({
        message: `Cannot find User with id = ${id}.`,
      });
    }
    res.send({
      connected: data.githubToken != null,
      updatedAt: data.githubTokenUpdatedAt || null,
      githubAccount: data.githubAccount || null,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving the GitHub token status for user with id = " + id,
    });
  }
};