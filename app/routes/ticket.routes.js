module.exports = (app) => {
  const Ticket = require("../controllers/ticket.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  // Create a new ticket
  router.post("/ticket/", [authenticateRoute, isAdmin], Ticket.create);

  // Retrieve all ticket
  router.get("/ticket/", authenticateRoute, Ticket.findAll);

  // Retrieve all ticket
  router.get("/ticket/project/:id", authenticateRoute, Ticket.findTicketsForAProject);

  // Retrieve all ticket
  router.get("/ticket/sprint/:id", authenticateRoute, Ticket.findTicketsForASprint);

  // Retrieve a single ticket with id
  router.get("/ticket/:id", authenticateRoute, Ticket.findOne);

  // Update a ticket with id
  router.put("/ticket/:id", [authenticateRoute, isAdmin], Ticket.update);

  // Delete a ticket with id
  router.delete("/ticket/:id", [authenticateRoute, isAdmin], Ticket.delete);

  // Delete all ticket
  router.delete("/ticket/", [authenticateRoute, isAdmin], Ticket.deleteAll);

  app.use("/museumapi", router);
};