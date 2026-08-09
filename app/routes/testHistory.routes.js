module.exports = (app) => {
  const TestHistory = require("../controllers/testHistory.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  var router = require("express").Router();

  router.post("/test/:id/history", authenticateRoute, TestHistory.create);

  router.get("/test/history/all", authenticateRoute, TestHistory.findAll);

  router.get("/test/:id/history", authenticateRoute, TestHistory.findAllForTest);

  app.use("/sprintboardapi", router);
};