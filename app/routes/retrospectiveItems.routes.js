module.exports = (app) => {
  const RetroItem = require("../controllers/retrospective.items.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: RetroItems
   *   description: RetroItems
   */

  /**
   * @swagger
   * /retroItems:
   *   post:
   *     summary: Create a new retroItem (Admin only)
   *     description: '`createdBy` is set automatically from the authenticated user — do not send it.'
   *     tags: [RetroItems]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RetroItemInput'
   *     responses:
   *       200:
   *         description: RetroItem created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RetroItem'
   *       400:
   *         description: Name missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
   */
  router.post("/retroItems/", [authenticateRoute], RetroItem.create);

  /**
   * @swagger
   * /retroItems:
   *   get:
   *     summary: Retrieve all retroItems
   *     description: >
   *       Supports a `name` query parameter (partial match). Each retroItem
   *       includes its sprints, ticket ids, board statuses, and repositories.
   *     tags: [RetroItems]
   *     parameters:
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Partial match filter on retroItem name.
   *     responses:
   *       200:
   *         description: Array of retroItems.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/RetroItem'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/retroItems/", authenticateRoute, RetroItem.findAll);

  /**
   * @swagger
   * /retroItems/{id}:
   *   get:
   *     summary: Retrieve a retroItem by id
   *     description: Includes board statuses and repositories.
   *     tags: [RetroItems]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The retroItem.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RetroItem'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/retroItems/:id", authenticateRoute, RetroItem.findOne);
  
  router.get("/retroItems/retro/:retroId", authenticateRoute, RetroItem.findRetroItem);


  /**
   * @swagger
   * /retroItems/{id}:
   *   put:
   *     summary: Update a retroItem by id (Admin only)
   *     tags: [RetroItems]
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
   *             $ref: '#/components/schemas/RetroItemInput'
   *     responses:
   *       200:
   *         description: RetroItem updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.put("/retroItems/:id", [authenticateRoute], RetroItem.update);

  /**
   * @swagger
   * /retroItems/{id}:
   *   delete:
   *     summary: Delete a retroItem by id (Admin only)
   *     tags: [RetroItems]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: RetroItem deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/retroItems/:id", [authenticateRoute], RetroItem.delete);

  /**
   * @swagger
   * /retroItems:
   *   delete:
   *     summary: Delete all retroItems (Admin only)
   *     tags: [RetroItems]
   *     responses:
   *       200:
   *         description: All retroItems deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/retroItems/", [authenticateRoute, isAdmin], RetroItem.deleteAll);

  app.use("/sprintboardapi", router);
};