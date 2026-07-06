module.exports = (app) => {
  const Show = require("../controllers/show.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");


  var router = require("express").Router();

  // Create a new show
  router.post("/shows/",[authenticateRoute, isAdmin], Show.create);

  // Retrieve all shows
  router.get("/shows/", Show.findAll);

  // Retrieve a single show with id
  router.get("/shows/:id", Show.findOne);

  // Update a show with id
  router.put("/shows/:id", [authenticateRoute, isAdmin], Show.update);

  // Delete a show with id
  router.delete("/shows/:id", [authenticateRoute, isAdmin], Show.delete);

  // Delete all shows
  router.delete("/shows/", [authenticateRoute, isAdmin], Show.deleteAll);

  app.use("/museumapi", router);
};