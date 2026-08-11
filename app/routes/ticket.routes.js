module.exports = (app) => {
  const Ticket = require("../controllers/ticket.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Tickets
   *   description: Kanban board tickets (user stories, bugs, enhancements)
   */

  /**
   * @swagger
   * /ticket:
   *   post:
   *     summary: Create a new ticket
   *     description: Callable by any authenticated user (not admin-restricted).
   *     tags: [Tickets]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TicketInput'
   *     responses:
   *       200:
   *         description: Ticket created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ticket'
   *       400:
   *         description: Title missing.
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
   *         description: Server error, including a missing type or priority.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/ticket/", authenticateRoute, Ticket.create);

  /**
   * @swagger
   * /ticket:
   *   get:
   *     summary: Retrieve all tickets
   *     description: Bare tickets — the ticketTests array is not included on this route.
   *     tags: [Tickets]
   *     responses:
   *       200:
   *         description: Array of tickets.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Ticket'
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
  router.get("/ticket/", authenticateRoute, Ticket.findAll);

  /**
   * @swagger
   * /ticket/project/{id}:
   *   get:
   *     summary: Retrieve all tickets for a project
   *     description: Includes each ticket's tests.
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Project id.
   *     responses:
   *       200:
   *         description: Array of tickets for the project.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Ticket'
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
  router.get("/ticket/project/:id", authenticateRoute, Ticket.findTicketsForAProject);

  /**
   * @swagger
   * /ticket/sprint/{id}:
   *   get:
   *     summary: Retrieve all tickets for a sprint
   *     description: Includes each ticket's tests.
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Sprint id.
   *     responses:
   *       200:
   *         description: Array of tickets for the sprint.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Ticket'
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
  router.get("/ticket/sprint/:id", authenticateRoute, Ticket.findTicketsForASprint);

  /**
   * @swagger
   * /ticket/user/{id}:
   *   get:
   *     summary: Retrieve all tickets assigned to a user
   *     description: >
   *       Matches on the ticket's assigneeId, across every project. Bare tickets
   *       — the ticketTests array is not included on this route.
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The assignee's user id.
   *     responses:
   *       200:
   *         description: >
   *           Array of tickets assigned to the user. Empty if they have none, or
   *           the user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Ticket'
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
  router.get("/ticket/user/:id", authenticateRoute, Ticket.findTicketsForAUser);

  /**
   * @swagger
   * /ticket/backlog:
   *   get:
   *     summary: Retrieve the backlog for a project
   *     description: >
   *       Returns all tickets for the given project that are not assigned to any
   *       sprint, ordered by priority then creation date. Bare tickets — the
   *       ticketTests array is not included on this route.
   *     tags: [Tickets]
   *     parameters:
   *       - in: query
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Id of the project whose backlog to fetch.
   *     responses:
   *       200:
   *         description: Array of unassigned tickets ordered by priority.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Ticket'
   *       400:
   *         description: projectId missing.
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
  router.get("/ticket/backlog", authenticateRoute, Ticket.findBacklog);

  router.get("/ticket/backlog", authenticateRoute, Ticket.findBacklog);

  /**
   * @swagger
   * /ticket/{id}:
   *   get:
   *     summary: Retrieve a ticket by id
   *     description: Includes the ticket's tests.
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: >
   *           The ticket. An id that does not exist is not a 404 — it returns 200
   *           with an empty body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ticket'
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
  router.get("/ticket/:id", authenticateRoute, Ticket.findOne);

  /**
   * @swagger
   * /ticket/{id}:
   *   put:
   *     summary: Update a ticket by id
   *     description: Callable by any authenticated user (not admin-restricted).
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TicketUpdateInput'
   *     responses:
   *       200:
   *         description: >
   *           Ticket updated (or not found / empty body). When the update moves
   *           the ticket into a board status carrying a GitHub event, a
   *           `github` object reports what the automation did. The ticket move
   *           succeeds regardless of whether the GitHub call did.
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/Message'
   *                 - type: object
   *                   properties:
   *                     github:
   *                       $ref: '#/components/schemas/GithubAutomationResult'
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
  router.put("/ticket/:id", authenticateRoute, Ticket.update);

  /**
   * @swagger
   * /ticket/{id}:
   *   delete:
   *     summary: Delete a ticket by id
   *     description: Callable by any authenticated user (not admin-restricted).
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Ticket deleted (or not found — both cases return 200 with a message).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
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
  router.delete("/ticket/:id", authenticateRoute, Ticket.delete);

  /**
   * @swagger
   * /ticket:
   *   delete:
   *     summary: Delete all tickets (Admin only)
   *     tags: [Tickets]
   *     responses:
   *       200:
   *         description: All tickets deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       401:
   *         description: Not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
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
  router.delete("/ticket/", [authenticateRoute, isAdmin], Ticket.deleteAll);

  router.get("/ticket/sprint/:sprintId", authenticateRoute, Ticket.findBySprint);

  /**
   * @swagger
   * /ticket/{id}/assign:
   *   put:
   *     summary: Move a ticket into a sprint
   *     description: >
   *       Sets the ticket's sprintId, removing it from the backlog. If the
   *       ticket is not yet on the board (no statusId), it is also placed in the
   *       first column of its project's board.
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Id of the ticket to move.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [sprintId]
   *             properties:
   *               sprintId:
   *                 type: integer
   *                 example: 3
   *     responses:
   *       200:
   *         description: Ticket moved to the sprint.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       400:
   *         description: sprintId missing.
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
   *       404:
   *         description: No ticket with that id.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error, including a sprintId that does not exist (foreign key violation).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.put("/ticket/:id/assign", authenticateRoute, Ticket.assignToSprint);

  /**
   * @swagger
   * /ticket/{id}/unassign:
   *   put:
   *     summary: Return a ticket to the backlog
   *     description: Clears the ticket's sprintId. The ticket keeps its board column.
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Id of the ticket to unassign.
   *     responses:
   *       200:
   *         description: Ticket returned to the backlog (or not found — both cases return 200 with a message).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
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
  router.put("/ticket/:id/unassign", authenticateRoute, Ticket.removeFromSprint);
  app.use("/sprintboardapi", router);
};