module.exports = (app) => {
  const Retro = require("../controllers/retrospective.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Retros
   *   description: Retros
   */

  /**
   * @swagger
   * /retros:
   *   post:
   *     summary: Create a new retro (Admin only)
   *     description: '`createdBy` is set automatically from the authenticated user — do not send it.'
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
   *         description: Name missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
   */
  router.post("/retros/", [authenticateRoute], Retro.create);

  /**
   * @swagger
   * /retros:
   *   get:
   *     summary: Retrieve all retros
   *     description: >
   *       Supports a `name` query parameter (partial match). Each retro
   *       includes its sprints, ticket ids, board statuses, and repositories.
   *     tags: [Retros]
   *     parameters:
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Partial match filter on retro name.
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
   *     description: Includes board statuses and repositories.
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
   * /retros/{id}:
   *   get:
   *     summary: retro for a sprint
   *     description: Includes retroItems and user
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
  
  router.get("/retros/sprint/:sprintId", authenticateRoute, Retro.findSprintRetro);


  /**
   * @swagger
   * /retros/{id}:
   *   put:
   *     summary: Update a retro by id 
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
   *       403:
   *         description: 
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