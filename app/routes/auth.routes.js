module.exports = (app) => {
  const auth = require("../controllers/auth.controller.js");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Auth
   *   description: Login and logout
   */

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Log in
   *     description: >
   *       Authenticates with HTTP Basic auth (NOT a JSON body) and returns a
   *       Bearer token plus the user's profile. Creates a new Session row
   *       that expires 1 day from login.
   *     tags: [Auth]
   *     security:
   *       - basicAuth: []
   *     responses:
   *       200:
   *         description: Login successful.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Missing/invalid Authorization header, or wrong password.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error while creating the session.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/login", auth.login);

  /**
   * @swagger
   * /logout:
   *   post:
   *     summary: Log out
   *     description: >
   *       Destroys the session tied to the given Bearer token. NOTE: if the
   *       Authorization header is missing or malformed, this endpoint
   *       currently sends no response at all (the request will hang).
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: >
   *           Logged out. An unrecognised or already-expired token is also a
   *           200 ("Already logged out."), not a 401.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   *       500:
   *         description: Server error while destroying the session.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/logout", auth.logout);

  app.use("/sprintboardapi", router);
};