const userController = require("../app/controllers/user.controller");
const db = require("../app/models");
const github = require("../app/services/github.service");
const { encrypt } = require("../app/authentication/crypto");

const User = db.user;
const Session = db.session;

jest.mock("../app/models", () => {
  const user = {
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
  };
  user.scope = jest.fn(() => user);

  return {
    user: user,
    project: {},
    session: { create: jest.fn(), findByPk: jest.fn() },
    userActivityLog: { create: jest.fn() },
    Sequelize: { Op: { like: Symbol("like") } },
  };
});

jest.mock("../app/services/github.service", () => ({
  validateToken: jest.fn(),
}));

jest.mock("../app/authentication/crypto", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  getSalt: jest.fn(),
  hashPassword: jest.fn(),
}));

jest.mock("../app/authentication/authentication", () => ({
  authenticate: jest.fn(),
  authenticateRoute: jest.fn(),
}));

const REAL_TOKEN = "github_pat_11ABCDEFG0abcdefghijklmnopqrstuvwxyz";

const REGISTRATION = {
  firstName: "Justin",
  lastName: "Walraven",
  username: "jwalraven",
  email: "justin@example.com",
  password: "Test1234!",
};

describe("User Controller — GitHub token", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      params: { id: "9" },
      userId: 9,
      headers: {},
      get: jest.fn(() => null),
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();

    github.validateToken.mockResolvedValue({ login: "justin", scopes: [] });
    encrypt.mockResolvedValue("encrypted-blob");

    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 9,
      username: "jwalraven",
      firstName: "Justin",
      lastName: "Walraven",
      email: "justin@example.com",
      githubAccount: "justin",
      globalRole: "USER",
    });
    User.update.mockResolvedValue([1]);
    Session.create.mockResolvedValue({ id: 1 });
  });


  describe("create — registration", () => {

    it("stores a null token when none is supplied and never calls GitHub", async () => {
      req.body = { ...REGISTRATION };

      await userController.create(req, res);

      const created = User.create.mock.calls[0][0];
      expect(created.githubToken).toBeNull();
      expect(created.githubTokenUpdatedAt).toBeNull();
      expect(github.validateToken).not.toHaveBeenCalled();
    });


    it("treats an explicit null token as no token", async () => {
      req.body = { ...REGISTRATION, githubToken: null };

      await userController.create(req, res);

      expect(User.create.mock.calls[0][0].githubToken).toBeNull();
      expect(github.validateToken).not.toHaveBeenCalled();
    });


    it("verifies, encrypts and stores a supplied token", async () => {
      req.body = { ...REGISTRATION, githubToken: REAL_TOKEN };

      await userController.create(req, res);

      expect(github.validateToken).toHaveBeenCalledWith(REAL_TOKEN);
      expect(encrypt).toHaveBeenCalledWith(REAL_TOKEN);

      const created = User.create.mock.calls[0][0];
      expect(created.githubToken).toBe("encrypted-blob");
      expect(created.githubTokenUpdatedAt).toBeInstanceOf(Date);
    });


    it("prefers the verified login over a client-supplied githubAccount", async () => {
      req.body = { ...REGISTRATION, githubAccount: "not-me", githubToken: REAL_TOKEN };

      await userController.create(req, res);

      expect(User.create.mock.calls[0][0].githubAccount).toBe("justin");
    });


    it("rejects a malformed token without calling GitHub or creating a user", async () => {
      req.body = { ...REGISTRATION, githubToken: "hunter2" };

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "That does not look like a GitHub personal access token.",
      });
      expect(github.validateToken).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });


    it("creates no user when GitHub rejects the token", async () => {
      req.body = { ...REGISTRATION, githubToken: REAL_TOKEN };
      const err = new Error("bad");
      err.code = "BAD_TOKEN";
      github.validateToken.mockRejectedValue(err);

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "GitHub rejected this token." });
      expect(User.create).not.toHaveBeenCalled();
    });


    it("returns 502 when GitHub cannot be reached", async () => {
      req.body = { ...REGISTRATION, githubToken: REAL_TOKEN };
      const err = new Error("offline");
      err.code = "NETWORK";
      github.validateToken.mockRejectedValue(err);

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(User.create).not.toHaveBeenCalled();
    });


    it("returns 503 when GitHub is rate limiting", async () => {
      req.body = { ...REGISTRATION, githubToken: REAL_TOKEN };
      const err = new Error("slow down");
      err.code = "RATE_LIMITED";
      github.validateToken.mockRejectedValue(err);

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(User.create).not.toHaveBeenCalled();
    });


    it("never returns the raw token in the registration response", async () => {
      req.body = { ...REGISTRATION, githubToken: REAL_TOKEN };

      await userController.create(req, res);

      const payload = JSON.stringify(res.send.mock.calls[0][0]);
      expect(payload).not.toContain(REAL_TOKEN);
      expect(payload).not.toContain("githubToken");
    });

  });


  describe("update", () => {

    it("leaves a stored token alone when the field is absent", async () => {
      req.body = { firstName: "Justin", globalRole: "USER" };
      User.findByPk.mockResolvedValue({ id: 9, globalRole: "USER" });

      await userController.update(req, res);

      const [updateData] = User.update.mock.calls[0];
      expect(updateData).not.toHaveProperty("githubToken");
      expect(updateData).not.toHaveProperty("githubTokenUpdatedAt");
      expect(github.validateToken).not.toHaveBeenCalled();
    });


    it("clears the token on an explicit null without calling GitHub", async () => {
      req.body = { githubToken: null };

      await userController.update(req, res);

      const [updateData] = User.update.mock.calls[0];
      expect(updateData.githubToken).toBeNull();
      expect(updateData.githubTokenUpdatedAt).toBeNull();
      expect(github.validateToken).not.toHaveBeenCalled();
    });


    it("verifies, encrypts and stores a new token", async () => {
      req.body = { githubToken: REAL_TOKEN };

      await userController.update(req, res);

      expect(github.validateToken).toHaveBeenCalledWith(REAL_TOKEN);

      const [updateData, where] = User.update.mock.calls[0];
      expect(updateData.githubToken).toBe("encrypted-blob");
      expect(updateData.githubTokenUpdatedAt).toBeInstanceOf(Date);
      expect(updateData.githubAccount).toBe("justin");
      expect(where).toEqual({ where: { id: "9" } });
    });


    it("returns 200 for a token-only update with no globalRole", async () => {
      req.body = { githubToken: REAL_TOKEN };

      await userController.update(req, res);

      // Regression guard: this used to 500 on globalRole.toLowerCase().
      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: "User was updated successfully.",
      });
    });


    it("rejects a malformed token before writing anything", async () => {
      req.body = { githubToken: "hunter2" };

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.update).not.toHaveBeenCalled();
      expect(github.validateToken).not.toHaveBeenCalled();
    });


    it("rejects an empty-string token", async () => {
      req.body = { githubToken: "   " };

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "githubToken cannot be empty!" });
      expect(User.update).not.toHaveBeenCalled();
    });


    it("writes nothing when GitHub rejects the token", async () => {
      req.body = { githubToken: REAL_TOKEN };
      const err = new Error("bad");
      err.code = "BAD_TOKEN";
      github.validateToken.mockRejectedValue(err);

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.update).not.toHaveBeenCalled();
    });


    it("accepts a classic token", async () => {
      req.body = { githubToken: "ghp_abcdefghijklmnopqrstuvwxyz0123456789" };

      await userController.update(req, res);

      expect(User.update).toHaveBeenCalled();
    });


    it("never returns the raw token in the response", async () => {
      req.body = { githubToken: REAL_TOKEN };

      await userController.update(req, res);

      const payload = JSON.stringify(res.send.mock.calls[0][0]);
      expect(payload).not.toContain(REAL_TOKEN);
    });


    it("still guards the last remaining admin", async () => {
      req.body = { globalRole: "USER", githubToken: REAL_TOKEN };
      User.findByPk.mockResolvedValue({ id: 9, globalRole: "ADMIN" });
      User.count.mockResolvedValue(1);

      await userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.update).not.toHaveBeenCalled();
    });

  });


  describe("getGithubTokenStatus", () => {

    it("reports a connected account without decrypting or calling GitHub", async () => {
      const updatedAt = new Date("2026-08-01T10:00:00Z");
      User.findByPk.mockResolvedValue({
        id: 9,
        githubAccount: "justin",
        githubToken: "encrypted-blob",
        githubTokenUpdatedAt: updatedAt,
      });

      await userController.getGithubTokenStatus(req, res);

      expect(res.send).toHaveBeenCalledWith({
        connected: true,
        updatedAt: updatedAt,
        githubAccount: "justin",
      });
      expect(github.validateToken).not.toHaveBeenCalled();
    });


    it("reports a user with no token as disconnected", async () => {
      User.findByPk.mockResolvedValue({
        id: 9,
        githubAccount: null,
        githubToken: null,
        githubTokenUpdatedAt: null,
      });

      await userController.getGithubTokenStatus(req, res);

      expect(res.send).toHaveBeenCalledWith({
        connected: false,
        updatedAt: null,
        githubAccount: null,
      });
    });


    it("returns 404 for a user that does not exist", async () => {
      User.findByPk.mockResolvedValue(null);

      await userController.getGithubTokenStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

  });

});
