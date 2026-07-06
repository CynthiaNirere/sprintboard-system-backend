module.exports = (app) => {
  const refund = require("../controllers/refund.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  var router = require("express").Router();

  // Create a new refund request
  router.post("/refunds/", [authenticateRoute], refund.create);

  // Retrieve all refunds (admin only)
  router.get("/refunds/", [authenticateRoute, isAdmin], refund.findAll);

  // Retrieve a single refund with id
  router.get("/refunds/:id", [authenticateRoute], refund.findOne);

  // Retrieve all refunds for a user
  router.get("/refunds/user/:userId", [authenticateRoute], refund.findForUser);

  // Update a refund with id (admin approves/denies)
  router.put("/refunds/:id", [authenticateRoute, isAdmin], refund.update);

  // Delete a refund with id
  router.delete("/refunds/:id", [authenticateRoute, isAdmin], refund.delete);

  app.use("/museumapi", router);
};