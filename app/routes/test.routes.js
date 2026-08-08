module.exports = (app) => {
  const Test = require("../controllers/test.controller.js");
  const TestHistory = require("../controllers/testHistory.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Tests
   *   description: Acceptance-criteria tests attached to a ticket
   */

  /**
   * @swagger
   * /test:
   *   post:
   *     summary: Create a new test (acceptance criterion) on a ticket (Admin only)
   *     tags: [Tests]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestInput'
   *     responses:
   *       200:
   *         description: Test created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Test'
   *       400:
   *         description: Missing title, description, or ticketId.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
   */
  router.post("/test/", authenticateRoute, Test.create);

  /**
   * @swagger
   * /test:
   *   get:
   *     summary: Retrieve all tests
   *     tags: [Tests]
   *     responses:
   *       200:
   *         description: Array of tests.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Test'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/ticket/:ticketId/test/", authenticateRoute, Test.findAll);

  /**
   * @swagger
   * /test/{id}:
   *   get:
   *     summary: Retrieve a test by id
   *     tags: [Tests]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The test.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Test'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/test/:id", authenticateRoute, Test.findOne);

  /**
   * @swagger
   * /test/{id}:
   *   put:
   *     summary: Update a test by id (Admin only)
   *     tags: [Tests]
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
   *             $ref: '#/components/schemas/TestInput'
   *     responses:
   *       200:
   *         description: Test updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.put("/test/:id", authenticateRoute, Test.update);

  /**
   * @swagger
   * /test/{id}:
   *   delete:
   *     summary: Delete a test by id (Admin only)
   *     tags: [Tests]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Test deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/test/:id", authenticateRoute, Test.delete);

  /**
   * @swagger
   * /test:
   *   delete:
   *     summary: Delete all tests (Admin only)
   *     tags: [Tests]
   *     responses:
   *       200:
   *         description: All tests deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/test/", [authenticateRoute, isAdmin], Test.deleteAll);

  app.use("/sprintboardapi", router);
};