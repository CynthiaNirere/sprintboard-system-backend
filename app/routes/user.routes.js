module.exports = (app) => {
  const User = require("../controllers/user.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  var router = require("express").Router();

  // Create a new User
  router.post("/users/", User.create);

  // Retrieve all Users
  router.get("/users/",[authenticateRoute, isAdmin], User.findAll);

  // Retrieve a single User with id
  router.get("/users/:id",[authenticateRoute, isAdmin], User.findOne);

  // Update a User with id
  router.put("/users/:id", [authenticateRoute, isAdmin], User.update);

  // Delete a User with id
  router.delete("/users/:id", [authenticateRoute, isAdmin], User.delete);

  // Delete all User
  router.delete("/users/", [authenticateRoute, isAdmin], User.deleteAll);

  app.use("/museumapi", router);
};
