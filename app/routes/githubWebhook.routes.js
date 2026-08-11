module.exports = (app) => {
  const GithubWebhook = require("../controllers/githubWebhook.controller.js");

  var router = require("express").Router();

  /**
   * @swagger
   * tags:
   *   name: GitHub
   *   description: Inbound GitHub webhook deliveries
   */

  /**
   * @swagger
   * /github/webhook:
   *   post:
   *     summary: Receive GitHub pull_request webhook deliveries
   *     description: >
   *       Unauthenticated by design — GitHub cannot present a bearer token, so
   *       authenticity is proven by the X-Hub-Signature-256 HMAC over the raw
   *       request body, checked against the secret stored on the matching
   *       repository. Configure the webhook with content type application/json
   *       and the Pull requests event only.
   *
   *       A PR opening or reopening moves the matching ticket to the board
   *       status whose githubEvent is pr_opened; a PR merging moves it to
   *       pr_merged. The ticket is matched by its githubBranchName equalling
   *       the pull request head branch, scoped to the repository's project.
   *     tags: [GitHub]
   *     security: []
   *     parameters:
   *       - in: header
   *         name: X-GitHub-Event
   *         required: true
   *         schema:
   *           type: string
   *           example: pull_request
   *       - in: header
   *         name: X-Hub-Signature-256
   *         required: true
   *         schema:
   *           type: string
   *           example: sha256=7d38cdd689735b008b3c702edd92eea23791c5f6
   *       - in: header
   *         name: X-GitHub-Delivery
   *         required: false
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GithubWebhookPayload'
   *     responses:
   *       200:
   *         description: >
   *           A ticket was moved, or the ping was acknowledged. A ping returns
   *           only `{ "message": "pong" }` — ticketId and statusId are present
   *           only when a ticket actually moved.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Ticket updated.
   *                 ticketId:
   *                   type: integer
   *                 statusId:
   *                   type: integer
   *       202:
   *         description: >
   *           Delivery accepted but nothing to do — an event or action we
   *           ignore, a repository that is not linked, no ticket matching the
   *           branch, more than one ticket matching it, or no board status
   *           configured for the event.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: More than one ticket matches this branch.
   *                 reason:
   *                   type: string
   *                   description: A machine-readable code, present only on the ambiguous-match case.
   *                   enum: [AMBIGUOUS_TICKET]
   *       400:
   *         description: Raw body unavailable — the webhook is not sending application/json.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Signature did not verify, or the repository has no webhook secret set.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: The stored secret could not be decrypted, or processing failed.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/github/webhook", GithubWebhook.handle);

  app.use("/sprintboardapi", router);
};
