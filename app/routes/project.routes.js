module.exports = (app) => {
  const Project = require("../controllers/project.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  // Create a new project
  router.post("/projects/", [authenticateRoute, isAdmin], Project.create);

  // Retrieve all projects
  router.get("/projects/", authenticateRoute, Project.findAll);

  // Retrieve a single project with id
  router.get("/projects/:id", authenticateRoute, Project.findOne);

  // Update a project with id
  router.put("/projects/:id", [authenticateRoute, isAdmin], Project.update);

  // Delete a project with id
  router.delete("/projects/:id", [authenticateRoute, isAdmin], Project.delete);

  // Delete all projects
  router.delete("/projects/", [authenticateRoute, isAdmin], Project.deleteAll);

  app.use("/museumapi", router);
};