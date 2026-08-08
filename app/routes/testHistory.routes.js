module.exports = (app) => {
  const TestHistory = require("../controllers/testHistory.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  var router = require("express").Router();

  router.post("/test/:id/history", authenticateRoute, TestHistory.create);

  router.get("/ticket/:ticketId/test/", authenticateRoute, TestHistory.findAll);

  app.use("/sprintboardapi", router);
};