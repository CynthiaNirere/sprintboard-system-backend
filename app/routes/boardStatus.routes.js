module.exports = (app) => {
  const BoardStatus = require("../controllers/boardStatus.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  const isProjectAdmin = require("../middleware/isProjectAdmin.js");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Board Statuses
   *   description: Per-project Kanban board columns
   */

  /**
   * @swagger
   * /boardStatus:
   *   post:
   *     summary: Create a new board status (Admin only)
   *     tags: [Board Statuses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BoardStatusInput'
   *     responses:
   *       200:
   *         description: Board status created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BoardStatus'
   *       400:
   *         description: Missing name, columnOrder, or projectId.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
   */
  router.post("/project/:projectId/boardStatus/", [authenticateRoute, isProjectAdmin], BoardStatus.create);

  /**
   * @swagger
   * /boardStatus:
   *   get:
   *     summary: Retrieve all board statuses
   *     tags: [Board Statuses]
   *     responses:
   *       200:
   *         description: Array of board statuses.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/BoardStatus'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/boardStatus/", authenticateRoute, BoardStatus.findAll);

  /**
   * @swagger
   * /boardStatus/{id}:
   *   get:
   *     summary: Retrieve a board status by id
   *     tags: [Board Statuses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The board status.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BoardStatus'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/boardStatus/:id", authenticateRoute, BoardStatus.findOne);

  router.get("/boardStatus/:projectId/column/:columnOrder", authenticateRoute, BoardStatus.findOneByColumn);

  /**
   * @swagger
   * /boardStatus/project/{id}:
   *   get:
   *     summary: Retrieve board statuses for a project, in column order
   *     tags: [Board Statuses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Project id.
   *     responses:
   *       200:
   *         description: Array of board statuses for the project.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/BoardStatus'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/boardStatus/project/:id", authenticateRoute, BoardStatus.findAllForProject);

  /**
   * @swagger
   * /boardStatus/{id}:
   *   put:
   *     summary: Update a board status by id (Admin only)
   *     tags: [Board Statuses]
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
   *             $ref: '#/components/schemas/BoardStatusInput'
   *     responses:
   *       200:
   *         description: Board status updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.put("/project/:projectId/boardStatus/:id", [authenticateRoute, isProjectAdmin], BoardStatus.update);

  /**
   * @swagger
   * /boardStatus/{id}:
   *   delete:
   *     summary: Delete a board status by id (Admin only)
   *     tags: [Board Statuses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Board status deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/project/:projectId/boardStatus/:id", [authenticateRoute, isProjectAdmin], BoardStatus.delete);

  /**
   * @swagger
   * /boardStatus:
   *   delete:
   *     summary: Delete all board statuses (Admin only)
   *     tags: [Board Statuses]
   *     responses:
   *       200:
   *         description: All board statuses deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/boardStatus/", [authenticateRoute, isAdmin], BoardStatus.deleteAll);

  app.use("/sprintboardapi", router);
};