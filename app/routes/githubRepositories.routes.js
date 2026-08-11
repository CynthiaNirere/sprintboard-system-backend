module.exports = (app) => {
  const Repo = require("../controllers/githubRepository.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Repos
   *   description: GitHub repositories linked to a project
   */

  /**
   * @swagger
   * /repo:
   *   post:
   *     summary: Link a GitHub repository to a project
   *     description: >
   *       owner and repoSlug are derived from the url automatically. The
   *       webhookSecret, if sent, is stored encrypted and never returned — not
   *       even on this response.
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
   *         description: Missing url, name, projectId, or developmentBranch; or webhookSecret was sent empty.
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
  router.get("/repo/", authenticateRoute, Repo.findAll);

  /**
   * @swagger
   * /repo/project/{projectId}:
   *   get:
   *     summary: Retrieve all repos linked to a project
   *     tags: [Repos]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The project whose repositories to return.
   *     responses:
   *       200:
   *         description: >
   *           Array of repos for the project. Empty if the project has none, or
   *           does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Repo'
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
   *         description: >
   *           The repo. An id that does not exist is not a 404 — it returns 200
   *           with an empty body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Repo'
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
   *             $ref: '#/components/schemas/RepoUpdateInput'
   *     responses:
   *       200:
   *         description: Repo updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       400:
   *         description: webhookSecret was sent empty. Send null to clear it, or omit it to leave it untouched.
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
   *         description: Repo deleted (or not found — both cases return 200 with a message).
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
  router.delete("/repo/:id", authenticateRoute, Repo.delete);

  /**
   * @swagger
   * /repo:
   *   delete:
   *     summary: Delete all repos
   *     description: Unlinks every repository from every project. Any authenticated user may call this.
   *     tags: [Repos]
   *     responses:
   *       200:
   *         description: All repos deleted.
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
  router.delete("/repo/", authenticateRoute, Repo.deleteAll);

  app.use("/sprintboardapi", router);
};