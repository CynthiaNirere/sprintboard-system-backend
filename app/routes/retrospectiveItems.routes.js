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
  router.post("/retroItems/", [authenticateRoute], RetroItem.create);

  /**
   * @swagger
   * /retroItems:
   *   get:
   *     summary: Retrieve all retro items
   *     description: >
   *       Each item includes the authoring user's id/email. Note that the
   *       controller accepts a `title` query parameter left over from a
   *       copy-pasted template — retro items have no title column, so supplying
   *       it produces a SQL error and a 500. Omit it.
   *     tags: [RetroItems]
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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error, including any request that supplies the `title` query parameter.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *         description: >
   *           The retro item. An id that does not exist is not a 404 — it
   *           returns 200 with an empty body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RetroItem'
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
  router.get("/retroItems/:id", authenticateRoute, RetroItem.findOne);

  /**
   * @swagger
   * /retroItems/retro/{retroId}:
   *   get:
   *     summary: Retrieve all items belonging to a given retro
   *     description: Filters by retroId. Each item includes the authoring user's id/email.
   *     tags: [RetroItems]
   *     parameters:
   *       - in: path
   *         name: retroId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: >
   *           Array of items for this retro. Empty if the retro has none, or
   *           does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/RetroItem'
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
  router.get("/retroItems/retro/:retroId", authenticateRoute, RetroItem.findRetroItem);

  /**
   * @swagger
   * /retroItems/{id}:
   *   put:
   *     summary: Update a retro item by id
   *     description: >
   *       Callable by any authenticated user — this route is not
   *       admin-restricted. Partial update — send only the fields you want to
   *       change.
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
   *             $ref: '#/components/schemas/RetroItemUpdateInput'
   *     responses:
   *       200:
   *         description: RetroItem updated (or not found / empty body).
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
   *         description: RetroItem deleted (or not found — both cases return 200 with a message).
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
  router.delete("/retroItems/", [authenticateRoute, isAdmin], RetroItem.deleteAll);

  app.use("/sprintboardapi", router);
};