module.exports = (app) => {
  const Comment = require("../controllers/comment.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");

  var router = require("express").Router();

    /**
   * @swagger
   * tags:
   *   name: Comments
   *   description: Comments on a ticket, with @mention email notifications
   */

  /**
   * @swagger
   * /comment:
   *   post:
   *     summary: Add a comment to a ticket
   *     description: >
   *       Callable by any authenticated user — this route is not
   *       admin-restricted. After saving, the content is scanned for
   *       "@First Last" mentions; each one matching a real user by first and
   *       last name triggers a fire-and-forget email notification via
   *       Nodemailer (EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS). A failed
   *       or unmatched mention never affects the response — the comment is
   *       already saved by the time mentions are parsed, and an email error
   *       is only logged server-side, not surfaced to the caller.
   *     tags: [Comments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CommentInput'
   *     responses:
   *       200:
   *         description: Comment created. Note this returns 200, not 201.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Comment'
   *       400:
   *         description: content, userId, or ticketId missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/comment/", authenticateRoute, Comment.create);

  /**
   * @swagger
   * /comment/ticket/{ticketId}:
   *   get:
   *     summary: Retrieve all comments for a ticket
   *     description: Includes each comment's author (firstName/lastName only). Ordered newest first.
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: ticketId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: >
   *           Array of comments for the ticket. Empty if the ticket has none, or
   *           does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Comment'
   *       401:
   *         description: Not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get("/comment/ticket/:ticketId", authenticateRoute, Comment.findAllForTicket);

  app.use("/sprintboardapi", router);
};