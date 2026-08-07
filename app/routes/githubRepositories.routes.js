module.exports = (app) => {
  const Repo = require("../controllers/githubRepository.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Repos
   *   description: Acceptance-criteria repos attached to a ticket
   */

  /**
   * @swagger
   * /repo:
   *   post:
   *     summary: Create a new repo (acceptance criterion) on a ticket 
   *     tags: [Repos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RepoInput'
   *     responses:
   *       200:
   *         description: Repo created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Repo'
   *       400:
   *         description: Missing title, description, or ticketId.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Login required.
   */
  router.post("/repo/", authenticateRoute, Repo.create);

  /**
   * @swagger
   * /repo:
   *   get:
   *     summary: Retrieve all repos
   *     tags: [Repos]
   *     responses:
   *       200:
   *         description: Array of repos.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Repo'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/repo/", authenticateRoute, Repo.findAll);

  /**
   * @swagger
   * /repo:
   *   get:
   *     summary: Retrieve all repos for a project
   *     tags: [Repos]
   *     responses:
   *       200:
   *         description: Array of repos.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Repo'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/repo/project/:projectId", authenticateRoute, Repo.findAllForProject);

  /**
   * @swagger
   * /repo/{id}:
   *   get:
   *     summary: Retrieve a repo by id
   *     tags: [Repos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The repo.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Repo'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/repo/:id", authenticateRoute, Repo.findOne);

  /**
   * @swagger
   * /repo/{id}:
   *   put:
   *     summary: Update a repo by id
   *     tags: [Repos]
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
   *             $ref: '#/components/schemas/RepoInput'
   *     responses:
   *       200:
   *         description: Repo updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Login required.
   */
  router.put("/repo/:id", authenticateRoute, Repo.update);

  /**
   * @swagger
   * /repo/{id}:
   *   delete:
   *     summary: Delete a repo by id
   *     tags: [Repos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Repo deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Login required.
   */
  router.delete("/repo/:id", authenticateRoute, Repo.delete);

  /**
   * @swagger
   * /repo:
   *   delete:
   *     summary: Delete all repos 
   *     tags: [Repos]
   *     responses:
   *       200:
   *         description: All repos deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Login required.
   */
  router.delete("/repo/", authenticateRoute, Repo.deleteAll);

  app.use("/sprintboardapi", router);
};