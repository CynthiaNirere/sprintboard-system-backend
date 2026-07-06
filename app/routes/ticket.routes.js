module.exports = (app) => {
  const ticket = require("../controllers/ticket.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  var router = require("express").Router();

  // Create a new ticket
  router.post("/tickets/", [authenticateRoute, isAdmin], ticket.create);

  // Retrieve all tickets
  router.get("/tickets/", ticket.findAll);

  // Retrieve a single ticket with id
  router.get("/tickets/:id", ticket.findOne);

  // Retrieve all tickets for a user
  router.get("/tickets/user/:userId", ticket.findForUser);

  // Update a ticket with id
  router.put("/tickets/:id", [authenticateRoute, isAdmin], ticket.update);

   // Update an ticket with id
  router.get("/tickets/checkin/:id", ticket.checkIn);
  
  // Admin manually refunds a ticket (deletes reservation)
  router.delete("/tickets/:id/refund", [authenticateRoute, isAdmin], ticket.adminRefundTicket);

  // Delete an ticket with id
  router.delete("/tickets/:id", [authenticateRoute, isAdmin], ticket.delete);

  app.use("/museumapi", router);
};