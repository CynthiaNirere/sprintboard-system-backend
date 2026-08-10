module.exports = (app) => {
  const Comment = require("../controllers/comment.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");

  var router = require("express").Router();

  router.post("/comment/", authenticateRoute, Comment.create);

  router.get("/comment/ticket/:ticketId", authenticateRoute, Comment.findAllForTicket);

  app.use("/sprintboardapi", router);
};