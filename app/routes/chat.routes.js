module.exports = (app) => {
  const Chat = require("../controllers/chat.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: Chat
   *   description: AI assistant chat, backed by the MCP server's tools
   */

  /**
   * @swagger
   * /chat:
   *   post:
   *     summary: Ask the AI assistant a question
   *     description: >
   *       Sends a message to the assistant, which may call MCP tools to
   *       answer using the developer's real project, sprint, and ticket
   *       data. Pass the `history` array back on the next call, unchanged,
   *       to continue the same conversation.
   *     tags: [Chat]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *                 description: The developer's question, in plain language.
   *               history:
   *                 type: array
   *                 description: The `history` array returned from the previous call, or omitted for a new conversation.
   *                 items:
   *                   type: object
   *     responses:
   *       200:
   *         description: The assistant's reply.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 reply:
   *                   type: string
   *                   description: The assistant's final, natural-language answer.
   *                 history:
   *                   type: array
   *                   description: Pass this back unchanged as `history` on the next call to continue the conversation.
   *                   items:
   *                     type: object
   *       400:
   *         description: message missing from request body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated.
   *       500:
   *         description: The assistant could not complete the request (e.g. the MCP server or Gemini API was unreachable).
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/chat", authenticateRoute, Chat.chat);

  app.use("/sprintboardapi", router);
};