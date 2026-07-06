module.exports = (app) => {
  const order = require("../controllers/order.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  var router = require("express").Router();

  // Create a new order
  router.post("/orders/", order.create);

  // Retrieve all orders
  router.get("/orders/", order.findAll);

  // Retrieve a single order with id
  router.get("/orders/:id", order.findOne);

  // Retrieve all orders for a user
  router.get("/orders/user/:userId", order.findForUser);

  // Update an order with id
  router.put("/orders/:id", [authenticateRoute, isAdmin], order.update);

  app.use("/museumapi", router);
};