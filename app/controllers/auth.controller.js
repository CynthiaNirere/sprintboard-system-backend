const db = require("../models");
const { authenticate } = require("../authentication/authentication");
const User = db.user;
const Session = db.session;
const Op = db.Sequelize.Op;
const { encrypt, decrypt } = require("../authentication/crypto");
const UserActivityLog = db.userActivityLog;
const { LogActions } = require("../config/userActivityLogActions");

exports.login = async (req, res) => {
  let { userId } = await authenticate(req, res, "credentials");

  if (userId !== undefined) {
    try {
      const user = await User.findByPk(userId);

      let expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + 1);

      const session = {
        email: user.email,
        userId: userId,
        expirationDate: expireTime,
      };
      const data = await Session.create(session);
      let sessionId = data.id;
      let token = await encrypt(sessionId);
      let userInfo = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        githubAccount: user.githubAccount,
        globalRole: user.globalRole,
        token: token,
        sessionExpireDate: session.expirationDate,
      };

      // Log the action to the user activity log
      try {
        await UserActivityLog.create({
          userId: user.id,
          action: LogActions.LOGIN,
          detail: ` logged in`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing LOGIN action to User Activity Log: ", error);
      }

      res.send(userInfo);
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the session.",
      });
    }
  }
};

exports.logout = async (req, res) => {
  let auth = req.get("authorization");
  if (auth != null && auth.startsWith("Bearer ")) {
    let token = auth.slice(7);
    let sessionId = await decrypt(token);
    if (sessionId == null) {
      return res.send({ message: "Already logged out." });
    }
    try {
      const session = await Session.findByPk(sessionId);
      const user = await User.findByPk(session.userId);
      await Session.destroy({ where: { id: sessionId } });

      // Log the action to the user activity log
      try {
        await UserActivityLog.create({
          userId: user.id,
          action: LogActions.LOGOUT,
          detail: ` logged out`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.log("Error writing LOGOUT action to User Activity Log: ", error);
      }

      return res.send({ message: "Logged out successfully." });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error logging out." });
    }
  }
};