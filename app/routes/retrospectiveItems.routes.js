module.exports = (app) => {
  const RetroItem = require("../controllers/retrospective.items.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: RetroItems
   *   description: Individual sticky-note items on a retrospective
   */

  /**
   * @swagger
   * /retroItems:
   *   post:
   *     summary: Create a new retro item
   *     description: Callable by any authenticated user — this route is not admin-restricted.
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
   *         description: itemType, content, userId, or retroId missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated.
   */
  router.post("/retroItems/", [authenticateRoute], RetroItem.create);

  /**
   * @swagger
   * /retroItems:
   *   get:
   *     summary: Retrieve all retro items
   *     description: >
   *       Supports a `title` query parameter (note: retro items don't
   *       actually have a title field, so this filter currently has no
   *       effect — likely leftover from a copy-pasted controller template).
   *       Each item includes the authoring user's id/email.
   *     tags: [RetroItems]
   *     parameters:
   *       - in: query
   *         name: title
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Array of retro items.
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
   *     summary: Retrieve a retro item by id
   *     description: Includes the authoring user's id/email.
   *     tags: [RetroItems]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The retro item.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RetroItem'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/retroItems/:id", authenticateRoute, RetroItem.findOne);

  /**
   * @swagger
   * /retroItems/retro/{retroId}:
   *   get:
   *     summary: Retrieve all items belonging to a given retro
   *     description: >
   *       NOTE: RetroItemServices.js's findSprintRetroItem() currently calls
   *       "retroItems/sprint/{sprintId}", which does not match this route
   *       (path segment "sprint" vs "retro", and this endpoint filters by
   *       retroId, not sprintId). Nothing appears to call
   *       findSprintRetroItem() yet, so this hasn't surfaced as a live bug,
   *       but it will 404 the moment something does. Worth fixing the
   *       frontend service to call this path before it's wired up.
   *     tags: [RetroItems]
   *     parameters:
   *       - in: path
   *         name: retroId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Array of items for this retro.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/RetroItem'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/retroItems/retro/:retroId", authenticateRoute, RetroItem.findRetroItem);

  /**
   * @swagger
   * /retroItems/{id}:
   *   put:
   *     summary: Update a retro item by id
   *     description: Callable by any authenticated user — this route is not admin-restricted.
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
   *       401:
   *         description: Not authenticated.
   */
  router.put("/retroItems/:id", [authenticateRoute], RetroItem.update);

  /**
   * @swagger
   * /retroItems/{id}:
   *   delete:
   *     summary: Delete a retro item by id
   *     description: Callable by any authenticated user — this route is not admin-restricted.
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
   *       401:
   *         description: Not authenticated.
   */
  router.delete("/retroItems/:id", [authenticateRoute], RetroItem.delete);

  /**
   * @swagger
   * /retroItems:
   *   delete:
   *     summary: Delete all retro items (Admin only)
   *     tags: [RetroItems]
   *     responses:
   *       200:
   *         description: All retro items deleted.
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