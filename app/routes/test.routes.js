module.exports = (app) => {
  const Test = require("../controllers/test.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  // Create a new project
  router.post("/test/", [authenticateRoute, isAdmin], Test.create);

  // Retrieve all test
  router.get("/test/", authenticateRoute, Test.findAll);

  // Retrieve a single project with id
  router.get("/test/:id", authenticateRoute, Test.findOne);

  // Update a project with id
  router.put("/test/:id", [authenticateRoute, isAdmin], Test.update);

  // Delete a project with id
  router.delete("/test/:id", [authenticateRoute, isAdmin], Test.delete);

  // Delete all test
  router.delete("/test/", [authenticateRoute, isAdmin], Test.deleteAll);

  app.use("/museumapi", router);
};