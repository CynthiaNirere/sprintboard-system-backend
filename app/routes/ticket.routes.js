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
   */
  router.post("/ticket/", authenticateRoute, Ticket.create);

  /**
   * @swagger
   * /ticket:
   *   get:
   *     summary: Retrieve all tickets
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
   */
  router.get("/ticket/sprint/:id", authenticateRoute, Ticket.findTicketsForASprint);

  /**
   * @swagger
   * /ticket/backlog:
   *   get:
   *     summary: Retrieve the backlog for a project
   *     description: Returns all tickets for the given project that are not assigned to any sprint.
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
   */
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
   *         description: The ticket.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Ticket'
   *       401:
   *         description: Not authenticated.
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
   *         description: Ticket updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       401:
   *         description: Not authenticated.
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
   *         description: Ticket deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       401:
   *         description: Not authenticated.
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
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/ticket/", [authenticateRoute, isAdmin], Ticket.deleteAll);

  /**
   * @swagger
   * /ticket/sprint/{sprintId}:
   *   get:
   *     summary: Retrieve all tickets in a sprint
   *     tags: [Tickets]
   *     parameters:
   *       - in: path
   *         name: sprintId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Id of the sprint.
   *     responses:
   *       200:
   *         description: Array of the sprint's tickets ordered by priority.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Ticket'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/ticket/sprint/:sprintId", authenticateRoute, Ticket.findBySprint);

  /**
   * @swagger
   * /ticket/{id}/assign:
   *   put:
   *     summary: Move a ticket into a sprint
   *     description: Sets the ticket's sprintId, removing it from the backlog.
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
   *       400:
   *         description: sprintId missing.
   *       401:
   *         description: Not authenticated.
   *       500:
   *         description: Sprint does not exist (foreign key violation).
   */
  router.put("/ticket/:id/assign", authenticateRoute, Ticket.assignToSprint);

  /**
   * @swagger
   * /ticket/{id}/unassign:
   *   put:
   *     summary: Return a ticket to the backlog
   *     description: Clears the ticket's sprintId.
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
   *         description: Ticket returned to the backlog.
   *       401:
   *         description: Not authenticated.
   */
  router.put("/ticket/:id/unassign", authenticateRoute, Ticket.removeFromSprint);
  app.use("/sprintboardapi", router);
};