module.exports = (app) => {
  const BoardStatus = require("../controllers/boardStatus.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  // Create a new project
  router.post("/boardStatus/", [authenticateRoute, isAdmin], BoardStatus.create);
0
  // Retrieve all boardStatus
  router.get("/boardStatus/", authenticateRoute, BoardStatus.findAll);

  // Retrieve a single project with id
  router.get("/boardStatus/:id", authenticateRoute, BoardStatus.findOne);

  // Retrieve a single project with id
  router.get("/boardStatus/project/:id", authenticateRoute, BoardStatus.findAllForProject);

  // Update a project with id
  router.put("/boardStatus/:id", [authenticateRoute, isAdmin], BoardStatus.update);

  // Delete a project with id
  router.delete("/boardStatus/:id", [authenticateRoute, isAdmin], BoardStatus.delete);

  // Delete all boardStatus
  router.delete("/boardStatus/", [authenticateRoute, isAdmin], BoardStatus.deleteAll);

  app.use("/museumapi", router);
};