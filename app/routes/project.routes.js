module.exports = (app) => {
  const Project = require("../controllers/project.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const isAdmin = require("../middleware/isAdmin");
  const isProjectAdmin = require("../middleware/isProjectAdmin.js");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Projects
   *   description: Projects and project membership
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
   *     description: Includes board statuses, repositories (id/name only), and sprints.
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
   * /projects/user/{userId}:
   *   get:
   *     summary: Retrieve all projects a given user belongs to
   *     description: >
   *       Same shape as GET /projects, filtered to projects where this user is
   *       a member. Returns 404 if the query itself fails, not when the user
   *       simply has zero projects (that case returns 200 with an empty array).
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Array of projects this user belongs to.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Project'
   *       401:
   *         description: Not authenticated.
   */
  router.get("/projects/user/:userId", authenticateRoute, Project.findUserProjects);

  /**
   * @swagger
   * /projects/{id}/members:
   *   get:
   *     summary: Retrieve all members of a project
   *     description: Returns each member's basic user info plus their projectRole from the project_members join table.
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Array of project members.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ProjectMember'
   *       401:
   *         description: Not authenticated.
   *       404:
   *         description: Project not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get("/projects/:id/members", authenticateRoute, Project.findProjectMembers);

  /**
   * @swagger
   * /projects/{id}/members:
   *   post:
   *     summary: Add a user to a project (Admin or Project Admin)
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
   *             $ref: '#/components/schemas/ProjectMemberInput'
   *     responses:
   *       201:
   *         description: Project member created.
   *       400:
   *         description: userId or projectRole missing from request body, or this user is already a member of the project.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin or Project Admin privileges required.
   */
  router.post("/projects/:projectId/members", [authenticateRoute, isProjectAdmin], Project.addProjectMember);

  /**
   * @swagger
   * /projects/{id}/members:
   *   put:
   *     summary: Update a member's project role (Admin, or Project Admin updating a Developer)
   *     description: >
   *       A non-Admin cannot update their own role, and cannot update someone
   *       who is currently PROJECT_ADMIN — both require a true Admin. NOTE:
   *       this checks the target's CURRENT role only, not the role being
   *       requested — a non-Admin Project Admin can currently promote a
   *       Developer straight to PROJECT_ADMIN. Confirm with your team whether
   *       that's intentional.
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
   *             $ref: '#/components/schemas/ProjectMemberInput'
   *     responses:
   *       200:
   *         description: Project role updated (also returned if the update matched but nothing changed).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       400:
   *         description: userId or projectRole missing from request body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: A non-Admin tried to update their own role, or another Project Admin's role.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: No matching project member found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.put("/projects/:projectId/members", [authenticateRoute, isProjectAdmin], Project.updateProjectMember);

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

  /**
   * @swagger
   * /projects/{id}/members/{userId}:
   *   delete:
   *     summary: Remove a user from a project (Admin, or Project Admin removing a Developer)
   *     description: >
   *       Only a true Admin can remove a member whose current projectRole is
   *       PROJECT_ADMIN — this applies even if that Project Admin is removing
   *       themselves. Matches the same restriction enforced in the UI.
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Project member deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       403:
   *         description: A non-Admin tried to remove a Project Admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: No matching project member found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.delete("/projects/:projectId/members/:userId", [authenticateRoute, isProjectAdmin], Project.deleteProjectMember);

  app.use("/sprintboardapi", router);
};