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
   * /project/{projectId}/boardStatus:
   *   post:
   *     summary: Create a new board status (Admins and Project Admins)
   *     description: >
   *       The projectId in the path is used only for authorization. The column
   *       itself is created against the projectId in the request body, and the
   *       two are never cross-checked.
   *     tags: [Board Statuses]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The project whose Project Admins may call this.
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
   *         description: Missing name, columnOrder, projectId, or githubEvent.
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
   *       403:
   *         description: Access denied. Admins or Project Admins only.
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
   *         description: >
   *           The board status. An id that does not exist is not a 404 — it
   *           returns 200 with an empty body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BoardStatus'
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
  router.get("/boardStatus/:id", authenticateRoute, BoardStatus.findOne);

  /**
   * @swagger
   * /boardStatus/{projectId}/column/{columnOrder}:
   *   get:
   *     summary: Retrieve one project's board status by its column position
   *     description: >
   *       Returns the single column at the given position on the given project,
   *       not an array.
   *     tags: [Board Statuses]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: columnOrder
   *         required: true
   *         schema:
   *           type: integer
   *         description: The column's position on the board.
   *     responses:
   *       200:
   *         description: >
   *           The board status. A project/column pair that matches nothing is
   *           not a 404 — it returns 200 with an empty body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BoardStatus'
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
  router.get("/boardStatus/project/:id", authenticateRoute, BoardStatus.findAllForProject);

  /**
   * @swagger
   * /project/{projectId}/boardStatus/{id}:
   *   put:
   *     summary: Update a board status by id (Admins and Project Admins)
   *     description: >
   *       Partial update — send only the fields you want to change. The
   *       projectId in the path is used only for authorization.
   *     tags: [Board Statuses]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The project whose Project Admins may call this.
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The board status to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BoardStatusUpdateInput'
   *     responses:
   *       200:
   *         description: Board status updated (or not found / empty body).
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
   *         description: Access denied. Admins or Project Admins only.
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
  router.put("/project/:projectId/boardStatus/:id", [authenticateRoute, isProjectAdmin], BoardStatus.update);

  /**
   * @swagger
   * /project/{projectId}/boardStatus/{id}:
   *   delete:
   *     summary: Delete a board status by id (Admins and Project Admins)
   *     description: >
   *       Tickets sitting in the deleted column are moved out first. A ticket
   *       with no sprint has its statusId cleared. A ticket in a sprint moves to
   *       the nearest preceding column of the project named by the path
   *       projectId; if that project has no earlier column, the ticket is cleared
   *       out of both its status and its sprint. The path projectId therefore
   *       affects the outcome — it is not only an authorization check.
   *     tags: [Board Statuses]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The project searched for the fallback column, and the project whose Project Admins may call this.
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The board status to delete.
   *     responses:
   *       200:
   *         description: Board status deleted.
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
   *         description: Access denied. Admins or Project Admins only.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: No board status with that id.
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
  router.delete("/boardStatus/", [authenticateRoute, isAdmin], BoardStatus.deleteAll);

  app.use("/sprintboardapi", router);
};