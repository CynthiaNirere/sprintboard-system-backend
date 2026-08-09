const crypto = require("crypto");

const webhook = require("../app/controllers/githubWebhook.controller");
const db = require("../app/models");
const { decrypt } = require("../app/authentication/crypto");
const { findStatusWithEvent } = require("../app/services/boardStatusAutomation");

const Repo = db.githubRepository;
const Ticket = db.ticket;

jest.mock("../app/models", () => {
  const githubRepository = { findOne: jest.fn() };
  githubRepository.scope = jest.fn(() => githubRepository);

  return {
    githubRepository: githubRepository,
    ticket: { findAll: jest.fn(), update: jest.fn() },
    userActivityLog: { create: jest.fn() },
  };
});

jest.mock("../app/authentication/crypto", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

jest.mock("../app/services/boardStatusAutomation", () => {
  const actual = jest.requireActual("../app/services/boardStatusAutomation");
  return {
    AutomationEvents: actual.AutomationEvents,
    findStatusWithEvent: jest.fn(),
  };
});

const SECRET = "testsecret";
const OTHER_SECRET = "a-different-repo-secret";

// name is the display label and is deliberately NOT the slug — the lookup must
// use owner + repoSlug.
const REPO = {
  id: 3,
  projectId: 1,
  owner: "acme",
  name: "Widgets API",
  repoSlug: "widgets",
  webhookSecret: "encrypted-blob",
};
const TICKET = { id: 42, title: "Users cannot login", projectId: 1, repoId: null };

// pull_request is destructured out so overriding one of its keys merges rather
// than replacing the whole object.
const prPayload = ({ pull_request: prOverrides, ...rest } = {}) => ({
  action: "opened",
  repository: { full_name: "acme/widgets" },
  ...rest,
  pull_request: {
    number: 7,
    merged: false,
    html_url: "https://github.com/acme/widgets/pull/7",
    head: { ref: "bugfix/users-cannot-login" },
    ...prOverrides,
  },
});

const sign = (body, secret) =>
  "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

/**
 * Builds a request the way express would after the raw-body verify callback.
 */
const makeReq = (payload, { secret = SECRET, event = "pull_request", signature } = {}) => {
  const body = JSON.stringify(payload);
  const headers = {
    "x-github-event": event,
    "x-github-delivery": "delivery-1",
    "x-hub-signature-256": signature === undefined ? sign(body, secret) : signature,
  };

  return {
    rawBody: Buffer.from(body),
    body: JSON.parse(body),
    ip: "140.82.115.1",
    headers: { "user-agent": "GitHub-Hookshot/abc" },
    get: jest.fn((name) => headers[String(name).toLowerCase()]),
  };
};

describe("GitHub webhook controller", () => {
  let res;

  beforeEach(() => {
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();

    Repo.findOne.mockResolvedValue({ ...REPO });
    decrypt.mockResolvedValue(SECRET);
    Ticket.findAll.mockResolvedValue([{ ...TICKET }]);
    Ticket.update.mockResolvedValue([1]);
    findStatusWithEvent.mockResolvedValue({ id: 3, name: "Ready for Test" });
  });


  describe("verification", () => {

    it("returns 400 when the raw body was not captured", async () => {
      const req = makeReq(prPayload());
      delete req.rawBody;

      await webhook.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Repo.findOne).not.toHaveBeenCalled();
    });


    it("accepts and ignores a payload with no repository", async () => {
      await webhook.handle(makeReq({ action: "opened" }), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(Repo.findOne).not.toHaveBeenCalled();
    });


    it("ignores a repository that is not linked, without decrypting anything", async () => {
      Repo.findOne.mockResolvedValue(null);

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(decrypt).not.toHaveBeenCalled();
    });


    it("looks the repository up by owner and name", async () => {
      await webhook.handle(makeReq(prPayload()), res);

      expect(Repo.findOne).toHaveBeenCalledWith({
        where: { owner: "acme", repoSlug: "widgets" },
      });
    });


    it("returns 401 when the repository has no secret configured", async () => {
      Repo.findOne.mockResolvedValue({ ...REPO, webhookSecret: null });

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        message: "No webhook secret configured for this repository.",
      });
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("returns 500 when the stored secret cannot be decrypted", async () => {
      decrypt.mockRejectedValue(new Error("[object Object]"));

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("returns 401 for a bad signature", async () => {
      const req = makeReq(prPayload(), { signature: sign("{}", SECRET) });

      await webhook.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Invalid signature." });
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("returns 401 for a signature of the wrong length without throwing", async () => {
      // timingSafeEqual throws on mismatched buffer lengths — the guard in the
      // controller is what turns this into a clean 401.
      const req = makeReq(prPayload(), { signature: "sha256=tooshort" });

      await webhook.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.status).not.toHaveBeenCalledWith(500);
    });


    it("returns 401 for a missing signature header", async () => {
      const req = makeReq(prPayload(), { signature: null });

      await webhook.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });


    it("rejects a signature that is valid for a different repository's secret", async () => {
      // Proves the key is per repo: signing with another repo's secret must not
      // authenticate a delivery for this one.
      const req = makeReq(prPayload(), { secret: OTHER_SECRET });

      await webhook.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(Ticket.update).not.toHaveBeenCalled();
    });

  });


  describe("event routing", () => {

    it("answers a signed ping with pong", async () => {
      await webhook.handle(makeReq(prPayload(), { event: "ping" }), res);

      expect(res.send).toHaveBeenCalledWith({ message: "pong" });
      expect(res.status).not.toHaveBeenCalledWith(202);
    });


    it("ignores events other than pull_request", async () => {
      await webhook.handle(makeReq(prPayload(), { event: "push" }), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(Ticket.findAll).not.toHaveBeenCalled();
    });


    it.each([
      ["synchronize"],
      ["labeled"],
      ["edited"],
      ["assigned"],
    ])("ignores the %s action", async (action) => {
      await webhook.handle(makeReq(prPayload({ action })), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("ignores a pull request closed without merging", async () => {
      const payload = prPayload({ action: "closed", pull_request: { merged: false } });

      await webhook.handle(makeReq(payload), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("treats reopened as PR_OPENED", async () => {
      await webhook.handle(makeReq(prPayload({ action: "reopened" })), res);

      expect(findStatusWithEvent).toHaveBeenCalledWith(1, "PR_OPENED");
    });


    it("treats closed with merged=true as PR_MERGED", async () => {
      const payload = prPayload({ action: "closed", pull_request: { merged: true } });

      await webhook.handle(makeReq(payload), res);

      expect(findStatusWithEvent).toHaveBeenCalledWith(1, "PR_MERGED");
    });

  });


  describe("ticket matching", () => {

    it("matches on the head branch scoped to the repository's project", async () => {
      await webhook.handle(makeReq(prPayload()), res);

      expect(Ticket.findAll).toHaveBeenCalledWith({
        where: { projectId: 1, githubBranchName: "bugfix/users-cannot-login" },
      });
    });


    it("accepts and ignores a pull request matching no ticket", async () => {
      Ticket.findAll.mockResolvedValue([]);

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("refuses to guess when two tickets share the branch name", async () => {
      Ticket.findAll.mockResolvedValue([{ ...TICKET }, { ...TICKET, id: 43 }]);

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.send).toHaveBeenCalledWith({
        message: "More than one ticket matches this branch.",
        reason: "AMBIGUOUS_TICKET",
      });
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("accepts and ignores a pull request with no head branch", async () => {
      const payload = prPayload();
      delete payload.pull_request.head;

      await webhook.handle(makeReq(payload), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(Ticket.findAll).not.toHaveBeenCalled();
    });

  });


  describe("moving the ticket", () => {

    it("accepts and ignores the event when no status carries it", async () => {
      findStatusWithEvent.mockResolvedValue(null);

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(Ticket.update).not.toHaveBeenCalled();
    });


    it("moves the ticket and records the PR url", async () => {
      await webhook.handle(makeReq(prPayload()), res);

      expect(Ticket.update).toHaveBeenCalledWith(
        {
          statusId: 3,
          githubPrURL: "https://github.com/acme/widgets/pull/7",
          repoId: 3,
        },
        { where: { id: 42 } }
      );
      expect(res.send).toHaveBeenCalledWith({
        message: "Ticket updated.",
        ticketId: 42,
        statusId: 3,
      });
    });


    it("leaves an existing repoId alone", async () => {
      Ticket.findAll.mockResolvedValue([{ ...TICKET, repoId: 9 }]);

      await webhook.handle(makeReq(prPayload()), res);

      expect(Ticket.update.mock.calls[0][0]).not.toHaveProperty("repoId");
    });


    it("writes an activity log with no acting user", async () => {
      await webhook.handle(makeReq(prPayload()), res);

      const logged = db.userActivityLog.create.mock.calls[0][0];
      expect(logged.userId).toBeNull();
      expect(logged.action).toBe("GitHub PR opened");
      expect(typeof logged.detail).toBe("string");
      expect(logged.detail.length).toBeGreaterThan(0);
    });


    it("still succeeds when the activity log write fails", async () => {
      db.userActivityLog.create.mockRejectedValue(new Error("log down"));

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Ticket updated.",
        ticketId: 42,
        statusId: 3,
      });
    });


    it("returns 500 when the update itself fails", async () => {
      Ticket.update.mockRejectedValue(new Error("db down"));

      await webhook.handle(makeReq(prPayload()), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: "Webhook processing failed." });
    });

  });

});
