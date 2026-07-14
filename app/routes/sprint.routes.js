module.exports = (app) => {
  const Sprint = require("../controllers/sprint.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Sprints
   *   description: Sprints
   */

  /**
   * @swagger
   * /sprints:
   *   post:
   *     summary: Create a new sprint (Admin only)
   *     tags: [Sprints]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SprintInput'
   *     responses:
   *       200:
   *         description: Sprint created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Sprint'
   *       400:
   *         description: Missing name, startDate, endDate, or projectId.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
   */
  router.post("/sprints/", [authenticateRoute, isAdmin], Sprint.create);

  /**
   * @swagger
   * /sprints/recurring:
   *   post:
   *     summary: Generate a series of recurring sprints (Admin only)
   *     tags: [Sprints]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RecurringSprintInput'
   *     responses:
   *       200:
   *         description: Recurring sprints created.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Sprint'
   *       400:
   *         description: Missing name, startDate, lengthDays, count, or projectId.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
   */
  router.post("/sprints/recurring", [authenticateRoute, isAdmin], Sprint.createRecurring);

  /**
   * @swagger
   * /sprints:
   *   get:
   *     summary: Retrieve all sprints
   *     description: Supports a `projectId` query parameter. Ordered by startDate ascending.
   *     tags: [Sprints]
   *     parameters:
   *       - in: query
   *         name: projectId
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Array of sprints.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Sprint'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/sprints/", authenticateRoute, Sprint.findAll);

  /**
   * @swagger
   * /sprints/{id}:
   *   get:
   *     summary: Retrieve a sprint by id
   *     tags: [Sprints]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The sprint.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Sprint'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/sprints/:id", authenticateRoute, Sprint.findOne);

  /**
   * @swagger
   * /sprints/{id}:
   *   put:
   *     summary: Update a sprint by id (Admin only)
   *     tags: [Sprints]
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
   *             $ref: '#/components/schemas/SprintInput'
   *     responses:
   *       200:
   *         description: Sprint updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.put("/sprints/:id", [authenticateRoute, isAdmin], Sprint.update);

  /**
   * @swagger
   * /sprints/{id}:
   *   delete:
   *     summary: Delete a sprint by id (Admin only)
   *     tags: [Sprints]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Sprint deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/sprints/:id", [authenticateRoute, isAdmin], Sprint.delete);

  /**
   * @swagger
   * /sprints:
   *   delete:
   *     summary: Delete all sprints (Admin only)
   *     tags: [Sprints]
   *     responses:
   *       200:
   *         description: All sprints deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/sprints/", [authenticateRoute, isAdmin], Sprint.deleteAll);

  app.use("/museumapi", router);
};