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
   *         description: Logged out (or was already logged out).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Message'
   */
  router.post("/logout", auth.logout);

  app.use("/sprintboardapi", router);
};