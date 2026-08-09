module.exports = (app) => {
  const User = require("../controllers/user.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  const selfOrAdmin = require("../middleware/selfOrAdmin.js");
  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Users
   *   description: Users
   */

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Register a new user
   *     description: Public endpoint — no auth required. Auto-logs the new user in and returns a token.
   *     tags: [Users]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserInput'
   *     responses:
   *       200:
   *         description: User created and logged in.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: >
   *           Missing required field, email already in use, or the supplied
   *           githubToken was malformed or rejected by GitHub. No user is
   *           created when the token is bad.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       502:
   *         description: A githubToken was supplied but GitHub could not be reached to verify it.
   *       503:
   *         description: A githubToken was supplied but GitHub is rate limiting requests.
   */
  router.post("/users/", User.create);

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Retrieve all users (Admin only)
   *     description: Supports an `id` query parameter (partial match).
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: string
   *         description: Partial match filter on user id.
   *     responses:
   *       200:
   *         description: Array of users (password/salt excluded).
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated.
   *       403:
   *         description: Admin privileges required.
   */
  router.get("/users/", [authenticateRoute], User.findAll);

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Retrieve a single user by id
   *     description: >
   *       Callable by the user themselves or an Admin. Includes the user's
   *       projects, with each project's sprints nested.
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       403:
   *         description: Access denied. Admins or account owners only.
   *       404:
   *         description: User not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get("/users/:id", [authenticateRoute], User.findOne);

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update a user by id
   *     description: >
   *       Callable by the user themselves or an Admin. Password cannot be
   *       changed via this route. Send githubToken to connect or replace the
   *       GitHub account, or null to clear it.
   *     tags: [Users]
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
   *             $ref: '#/components/schemas/UserUpdateInput'
   *     responses:
   *       200:
   *         description: User updated (or no matching user / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       400:
   *         description: The supplied githubToken was malformed or rejected by GitHub.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Access denied. Admins or account owners only.
   *       502:
   *         description: A githubToken was supplied but GitHub could not be reached to verify it.
   *       503:
   *         description: A githubToken was supplied but GitHub is rate limiting requests.
   */
  router.put("/users/:id", [authenticateRoute, selfOrAdmin], User.update);

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete a user by id (Admin only)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/users/:id", [authenticateRoute, isAdmin], User.delete);

  /**
   * @swagger
   * /users:
   *   delete:
   *     summary: Delete all users (Admin only)
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: All users deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/users/", [authenticateRoute, isAdmin], User.deleteAll);

  /**
   * @swagger
   * /users/{id}/github-token:
   *   get:
   *     summary: Check whether a user has a GitHub token on file
   *     description: >
   *       Returns only whether a token exists and when it was last set. The
   *       token is never decrypted or returned. Set it via POST /users or
   *       PUT /users/{id}; clear it by sending githubToken: null to
   *       PUT /users/{id}.
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The user's GitHub connection status.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/GithubTokenStatus'
   *       403:
   *         description: Access denied. Admins or account owners only.
   *       404:
   *         description: User not found.
   */
  router.get("/users/:id/github-token", [authenticateRoute, selfOrAdmin], User.getGithubTokenStatus);

  app.use("/sprintboardapi", router);
};