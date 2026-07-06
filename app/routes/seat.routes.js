module.exports = (app) => {
  const seat = require("../controllers/seat.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  var router = require("express").Router();

  // Create a new seat
  router.post("/seats/", [authenticateRoute, isAdmin], seat.create);

  // Retrieve all seats
  router.get("/seats/", seat.findAll);

  // Retrieve a single seat with id 
  router.get("/seats/:id", seat.findOne);

  // Update an seat with id
  router.put("/seats/:id", [authenticateRoute, isAdmin], seat.update);

  // Delete an seat with id
  router.delete("/seats/:id", [authenticateRoute, isAdmin], seat.delete);

  // Delete all seats
  router.delete("/seats/", [authenticateRoute, isAdmin], seat.deleteAll);

  app.use("/museumapi", router);
};