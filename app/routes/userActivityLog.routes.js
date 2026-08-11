module.exports = (app) => {
  const UserActivityLogs = require("../controllers/userActivityLog.controller.js")
  const { authenticateRoute } = require("../authentication/authentication");
  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: User Activity Logs
   *   description: >
   *     The workspace audit trail. Entries are written automatically by the
   *     endpoints that perform each action — there is no endpoint for creating
   *     them by hand.
   */

  /**
   * @swagger
   * /userActivityLogs:
   *   get:
   *     summary: Retrieve every user activity log entry
   *     description: Newest first. Returns bare entries — the acting user is not included.
   *     tags: [User Activity Logs]
   *     responses:
   *       200:
   *         description: Array of log entries, ordered by createdAt descending.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/UserActivityLog'
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
  router.get("/userActivityLogs/", authenticateRoute, UserActivityLogs.findAll);

  app.use("/sprintboardapi", router);
};
