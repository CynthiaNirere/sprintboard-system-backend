module.exports = (app) => {
  const Test = require("../controllers/test.controller.js");
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
   *     summary: Create a new test (acceptance criterion) on a ticket
   *     description: Any authenticated user may create a test.
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
  router.post("/test/", authenticateRoute, Test.create);

  /**
   * @swagger
   * /ticket/{ticketId}/test:
   *   get:
   *     summary: Retrieve the tests attached to one ticket
   *     tags: [Tests]
   *     parameters:
   *       - in: path
   *         name: ticketId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ticket whose tests to return.
   *     responses:
   *       200:
   *         description: Array of tests for the ticket. Empty if the ticket has none, or does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Test'
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
   *         description: >
   *           The test. An id that does not exist is not a 404 — it returns 200
   *           with an empty body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Test'
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
  router.get("/test/:id", authenticateRoute, Test.findOne);

  /**
   * @swagger
   * /test/{id}:
   *   put:
   *     summary: Update a test by id
   *     description: >
   *       Any authenticated user may update a test. Partial update — send only
   *       the fields you want to change. This is the route used to record a
   *       test run by changing status and findings.
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
   *             $ref: '#/components/schemas/TestUpdateInput'
   *     responses:
   *       200:
   *         description: Test updated (or not found / empty body).
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
  router.put("/test/:id", authenticateRoute, Test.update);

  /**
   * @swagger
   * /test/{id}:
   *   delete:
   *     summary: Delete a test by id
   *     description: Any authenticated user may delete a test.
   *     tags: [Tests]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Test deleted (or not found — both cases return 200 with a message).
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
  router.delete("/test/", [authenticateRoute, isAdmin], Test.deleteAll);

  app.use("/sprintboardapi", router);
};