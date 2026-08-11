module.exports = (app) => {
  const TicketHistoryHistory = require("../controllers/ticketHistory.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Ticket History
   *   description: >
   *     The change log for tickets. Entries are written automatically when a
   *     ticket is created and on every field that changes when one is updated —
   *     there is no endpoint for creating them by hand.
   */

  /**
   * @swagger
   * /ticket/history/all:
   *   get:
   *     summary: Retrieve every ticket history entry
   *     description: Newest first. Returns bare entries — the related ticket and user are not included.
   *     tags: [Ticket History]
   *     responses:
   *       200:
   *         description: Array of history entries, ordered by createdAt descending.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TicketHistory'
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
  router.get("/ticket/history/all", authenticateRoute, TicketHistoryHistory.findAll);

  /**
   * @swagger
   * /ticket/{id}/history:
   *   get:
   *     summary: Retrieve the history entries for one ticket
   *     description: Newest first. Returns bare entries — the related ticket and user are not included.
   *     tags: [Ticket History]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ticket whose history to return.
   *     responses:
   *       200:
   *         description: >
   *           Array of history entries, ordered by createdAt descending. Empty if
   *           the ticket has no history, or does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TicketHistory'
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
  router.get("/ticket/:id/history", authenticateRoute, TicketHistoryHistory.findAllForTicket);

  app.use("/sprintboardapi", router);
};
