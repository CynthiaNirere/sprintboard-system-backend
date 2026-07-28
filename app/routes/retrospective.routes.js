module.exports = (app) => {
  const Retro = require("../controllers/retrospective.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Retros
   *   description: Sprint retrospectives
   */

  /**
   * @swagger
   * /retros:
   *   post:
   *     summary: Create a new retro
   *     description: Callable by any authenticated user — this route is not admin-restricted.
   *     tags: [Retros]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RetroInput'
   *     responses:
   *       200:
   *         description: Retro created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Retro'
   *       400:
   *         description: title, status, or sprintId missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated.
   */
  router.post("/retros/", [authenticateRoute], Retro.create);

  /**
   * @swagger
   * /retros:
   *   get:
   *     summary: Retrieve all retros
   *     description: >
   *       Supports a `title` query parameter (partial match). Each retro
   *       includes its sprint (id/name) and its retrospective items, each
   *       with the authoring user's id/email.
   *     tags: [Retros]
   *     parameters:
   *       - in: query
   *         name: title
   *         schema:
   *           type: string
   *         description: Partial match filter on retro title.
   *     responses:
   *       200:
   *         description: Array of retros.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Retro'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/retros/", authenticateRoute, Retro.findAll);

  /**
   * @swagger
   * /retros/{id}:
   *   get:
   *     summary: Retrieve a retro by id
   *     description: Includes the sprint (id/name) and retrospective items with author info.
   *     tags: [Retros]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The retro.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Retro'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/retros/:id", authenticateRoute, Retro.findOne);

  /**
   * @swagger
   * /retros/sprint/{sprintId}:
   *   get:
   *     summary: Retrieve the retro for a given sprint
   *     description: >
   *       Same includes as GET /retros/{id} (sprint + retrospective items with
   *       author info). Returns 404 if this sprint has no retro yet.
   *     tags: [Retros]
   *     parameters:
   *       - in: path
   *         name: sprintId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The retro for this sprint.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Retro'
   *       401:
   *         description: Not authenticated.
   *       404:
   *         description: No retro exists yet for this sprint.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get("/retros/sprint/:sprintId", authenticateRoute, Retro.findSprintRetro);

  /**
   * @swagger
   * /retros/{id}:
   *   put:
   *     summary: Update a retro by id
   *     description: Callable by any authenticated user — this route is not admin-restricted.
   *     tags: [Retros]
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
   *             $ref: '#/components/schemas/RetroInput'
   *     responses:
   *       200:
   *         description: Retro updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       401:
   *         description: Not authenticated.
   */
  router.put("/retros/:id", [authenticateRoute], Retro.update);

  /**
   * @swagger
   * /retros/{id}:
   *   delete:
   *     summary: Delete a retro by id (Admin only)
   *     tags: [Retros]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Retro deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/retros/:id", [authenticateRoute, isAdmin], Retro.delete);

  /**
   * @swagger
   * /retros:
   *   delete:
   *     summary: Delete all retros (Admin only)
   *     tags: [Retros]
   *     responses:
   *       200:
   *         description: All retros deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/retros/", [authenticateRoute, isAdmin], Retro.deleteAll);

  app.use("/sprintboardapi", router);
};