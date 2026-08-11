module.exports = (app) => {
  const TestHistory = require("../controllers/testHistory.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Test History
   *   description: Audit entries recorded against individual tests
   */

  /**
   * @swagger
   * /test/{id}/history:
   *   post:
   *     summary: Add a history entry to a test
   *     description: >
   *       Note that userId comes from the request body, not from the
   *       authenticated session — the entry is attributed to whoever the caller
   *       names. Neither field is validated, so omitting one fails the NOT NULL
   *       constraint and returns 500 rather than 400.
   *     tags: [Test History]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The test this entry belongs to. Stored as the entry's testId.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestHistoryInput'
   *     responses:
   *       200:
   *         description: The created history entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TestHistory'
   *       401:
   *         description: Not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error, including a missing message or userId.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/test/:id/history", authenticateRoute, TestHistory.create);

  /**
   * @swagger
   * /test/history/all:
   *   get:
   *     summary: Retrieve every test history entry
   *     description: Newest first. Returns bare entries — the related test and user are not included.
   *     tags: [Test History]
   *     responses:
   *       200:
   *         description: Array of history entries, ordered by createdAt descending.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TestHistory'
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
  router.get("/test/history/all", authenticateRoute, TestHistory.findAll);

  /**
   * @swagger
   * /test/{id}/history:
   *   get:
   *     summary: Retrieve the history entries for one test
   *     description: Newest first. Returns bare entries — the related test and user are not included.
   *     tags: [Test History]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The test whose history to return.
   *     responses:
   *       200:
   *         description: >
   *           Array of history entries, ordered by createdAt descending. Empty if
   *           the test has no history, or does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TestHistory'
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
  router.get("/test/:id/history", authenticateRoute, TestHistory.findAllForTest);

  app.use("/sprintboardapi", router);
};
