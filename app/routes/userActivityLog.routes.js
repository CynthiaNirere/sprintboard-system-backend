module.exports = (app) => {
  const UserActivityLogs = require("../controllers/userActivityLog.controller.js")
  const { authenticateRoute } = require("../authentication/authentication");
  var router = require("express").Router();

  router.get("/userActivityLogs/", authenticateRoute, UserActivityLogs.findAll);

  app.use("/sprintboardapi", router);
};