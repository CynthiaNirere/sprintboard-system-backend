module.exports = (app) => {
  const Project = require("../controllers/project.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Projects
   *   description: Projects
   */

  /**
   * @swagger
   * /projects:
   *   post:
   *     summary: Create a new project (Admin only)
   *     description: '`createdBy` is set automatically from the authenticated user — do not send it.'
   *     tags: [Projects]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProjectInput'
   *     responses:
   *       200:
   *         description: Project created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Project'
   *       400:
   *         description: Name missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin privileges required.
   */
  router.post("/projects/", [authenticateRoute, isAdmin], Project.create);

  /**
   * @swagger
   * /projects:
   *   get:
   *     summary: Retrieve all projects
   *     description: >
   *       Supports a `name` query parameter (partial match). Each project
   *       includes its sprints, ticket ids, board statuses, and repositories.
   *     tags: [Projects]
   *     parameters:
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Partial match filter on project name.
   *     responses:
   *       200:
   *         description: Array of projects.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Project'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/projects/", authenticateRoute, Project.findAll);

  /**
   * @swagger
   * /projects/{id}:
   *   get:
   *     summary: Retrieve a project by id
   *     description: Includes board statuses and repositories.
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: The project.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Project'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/projects/:id", authenticateRoute, Project.findOne);

  /**
   * @swagger
   * /projects/{id}:
   *   put:
   *     summary: Update a project by id (Admin only)
   *     tags: [Projects]
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
   *             $ref: '#/components/schemas/ProjectInput'
   *     responses:
   *       200:
   *         description: Project updated (or not found / empty body).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.put("/projects/:id", [authenticateRoute, isAdmin], Project.update);

  /**
   * @swagger
   * /projects/{id}:
   *   delete:
   *     summary: Delete a project by id (Admin only)
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Project deleted (or not found).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/projects/:id", [authenticateRoute, isAdmin], Project.delete);

  /**
   * @swagger
   * /projects:
   *   delete:
   *     summary: Delete all projects (Admin only)
   *     tags: [Projects]
   *     responses:
   *       200:
   *         description: All projects deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: Admin privileges required.
   */
  router.delete("/projects/", [authenticateRoute, isAdmin], Project.deleteAll);

  app.use("/museumapi", router);
};