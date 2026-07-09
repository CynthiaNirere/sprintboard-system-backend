module.exports = (app) => {
  const Sprint = require("../controllers/sprint.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  // Create a new sprint
  router.post("/sprints/", [authenticateRoute, isAdmin], Sprint.create);

  // Create recurring sprints
  router.post("/sprints/recurring", [authenticateRoute, isAdmin], Sprint.createRecurring);

  // Retrieve all sprints 
  router.get("/sprints/", authenticateRoute, Sprint.findAll);

  // Retrieve a single sprint with id
  router.get("/sprints/:id", authenticateRoute, Sprint.findOne);

  // Update a sprint with id
  router.put("/sprints/:id", [authenticateRoute, isAdmin], Sprint.update);

  // Delete a sprint with id
  router.delete("/sprints/:id", [authenticateRoute, isAdmin], Sprint.delete);

  // Delete all sprints
  router.delete("/sprints/", [authenticateRoute, isAdmin], Sprint.deleteAll);

   app.use("/museumapi", router);
};