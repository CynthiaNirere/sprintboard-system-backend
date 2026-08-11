module.exports = (app) => {
  const Sprint = require("../controllers/sprint.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  const isProjectAdmin = require("../middleware/isProjectAdmin.js");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Sprints
   *   description: Sprints
   */

  /**
   * @swagger
   * /project/{projectId}/sprints:
   *   post:
   *     summary: Create a new sprint (Admins and Project Admins)
   *     description: >
   *       The projectId in the path is used only for authorization. The sprint
   *       itself is created against the projectId in the request body, and the
   *       two are never cross-checked.
   *     tags: [Sprints]
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
   *             $ref: '#/components/schemas/SprintInput'
   *     responses:
   *       200:
   *         description: Sprint created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Sprint'
   *       400:
   *         description: >
   *           The new sprint's dates overlap an existing sprint on the same
   *           project. Note that a missing name, startDate, endDate or projectId
   *           is not reported here — the validation for those throws instead of
   *           responding, so the request never completes.
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
  router.post("/project/:projectId/sprints/", [authenticateRoute, isProjectAdmin], Sprint.create);

  /**
   * @swagger
   * /project/{projectId}/sprints/recurring:
   *   post:
   *     summary: Generate a series of recurring sprints (Admins and Project Admins)
   *     description: >
   *       The projectId in the path is used only for authorization. The sprints
   *       are created against the projectId in the request body, and the two are
   *       never cross-checked.
   *     tags: [Sprints]
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
   *         description: >
   *           Missing name, startDate, lengthDays, count, or projectId; or one of
   *           the generated sprints overlaps an existing sprint on the same project.
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
  router.post("/project/:projectId/sprints/recurring", [authenticateRoute, isProjectAdmin], Sprint.createRecurring);

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
   *         description: >
   *           The sprint. An id that does not exist is not a 404 — it returns
   *           200 with an empty body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Sprint'
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
  router.get("/sprints/:id", authenticateRoute, Sprint.findOne);

  /**
   * @swagger
   * /project/{projectId}/sprints/{id}:
   *   put:
   *     summary: Update a sprint by id (Admins and Project Admins)
   *     description: >
   *       Partial update — send only the fields you want to change. The
   *       projectId in the path is used only for authorization; it does not have
   *       to match the sprint's own project.
   *     tags: [Sprints]
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
   *         description: The sprint to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SprintUpdateInput'
   *     responses:
   *       200:
   *         description: >
   *           Sprint updated. This message is sent whether or not any row
   *           matched, so it does not confirm that the sprint exists.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       400:
   *         description: The new dates overlap an existing sprint on the same project.
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
  router.put("/project/:projectId/sprints/:id", [authenticateRoute, isProjectAdmin], Sprint.update);

  /**
   * @swagger
   * /project/{projectId}/sprints/{id}:
   *   delete:
   *     summary: Delete a sprint by id (Admins and Project Admins)
   *     tags: [Sprints]
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
   *         description: The sprint to delete.
   *     responses:
   *       200:
   *         description: Sprint deleted (or not found — both cases return 200 with a message).
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
  router.delete("/project/:projectId/sprints/:id", [authenticateRoute, isProjectAdmin], Sprint.delete);

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
  router.delete("/sprints/", [authenticateRoute, isAdmin], Sprint.deleteAll);

  app.use("/sprintboardapi", router);
};