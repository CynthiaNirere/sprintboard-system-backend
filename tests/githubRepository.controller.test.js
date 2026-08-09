const repoController = require("../app/controllers/githubRepository.controller");
const db = require("../app/models");
const { encrypt } = require("../app/authentication/crypto");

const Repo = db.githubRepository;

jest.mock("../app/models", () => ({
  githubRepository: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  // The controller destructures this at require time.
  Sequelize: { Op: {} },
}));

jest.mock("../app/authentication/crypto", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

const URL = "https://github.com/acme/widgets";

// Whatever create() is handed back is what the response is built from.
const created = (values) => ({ ...values, toJSON: () => ({ id: 3, ...values }) });

describe("githubRepository controller", () => {
  let res;

  beforeEach(() => {
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();

    encrypt.mockResolvedValue("encrypted-blob");
    Repo.create.mockImplementation(async (values) => created(values));
    Repo.update.mockResolvedValue([1]);
  });

  describe("create", () => {
    const body = {
      url: URL,
      name: "Widgets API",
      projectId: 1,
      developmentBranch: "dev",
    };

    it("stores the name exactly as sent", async () => {
      await repoController.create({ body: { ...body } }, res);

      expect(Repo.create).toHaveBeenCalledWith({
        url: URL,
        name: "Widgets API",
        projectId: 1,
        developmentBranch: "dev",
      });
    });

    it("does not derive owner or repoSlug itself — that is the model hook's job", async () => {
      await repoController.create({ body: { ...body } }, res);

      const values = Repo.create.mock.calls[0][0];
      expect(values).not.toHaveProperty("owner");
      expect(values).not.toHaveProperty("repoSlug");
    });

    it("rejects a missing name", async () => {
      await repoController.create({ body: { ...body, name: undefined } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Repo.create).not.toHaveBeenCalled();
    });

    it("encrypts a webhook secret before storing it", async () => {
      await repoController.create({ body: { ...body, webhookSecret: "  s3cret  " } }, res);

      expect(encrypt).toHaveBeenCalledWith("s3cret");
      expect(Repo.create.mock.calls[0][0].webhookSecret).toBe("encrypted-blob");
    });

    it("never echoes the webhook secret back", async () => {
      await repoController.create({ body: { ...body, webhookSecret: "s3cret" } }, res);

      expect(res.send.mock.calls[0][0]).not.toHaveProperty("webhookSecret");
      expect(res.send.mock.calls[0][0].name).toBe("Widgets API");
    });
  });

  describe("update", () => {
    const req = (body) => ({ params: { id: "3" }, body: body });

    it("keeps the sent name and derives owner/repoSlug when the url is present", async () => {
      await repoController.update(req({ url: URL, name: "Widgets API" }), res);

      expect(Repo.update).toHaveBeenCalledWith(
        { url: URL, name: "Widgets API", owner: "acme", repoSlug: "widgets" },
        { where: { id: "3" } }
      );
    });

    it("renames the label without touching the derived columns", async () => {
      await repoController.update(req({ name: "Renamed" }), res);

      const values = Repo.update.mock.calls[0][0];
      expect(values).toEqual({ name: "Renamed" });
      expect(values).not.toHaveProperty("owner");
      expect(values).not.toHaveProperty("repoSlug");
    });

    it("leaves owner/repoSlug alone when the url cannot be parsed", async () => {
      await repoController.update(req({ url: "a;sldkfj", name: "Widgets API" }), res);

      expect(Repo.update.mock.calls[0][0]).toEqual({ url: "a;sldkfj", name: "Widgets API" });
    });

    it("encrypts a rotated webhook secret", async () => {
      await repoController.update(req({ webhookSecret: "new-secret" }), res);

      expect(encrypt).toHaveBeenCalledWith("new-secret");
      expect(Repo.update.mock.calls[0][0].webhookSecret).toBe("encrypted-blob");
    });

    it("clears the webhook secret on null", async () => {
      await repoController.update(req({ webhookSecret: null }), res);

      expect(encrypt).not.toHaveBeenCalled();
      expect(Repo.update.mock.calls[0][0].webhookSecret).toBeNull();
    });

    it("rejects an empty webhook secret rather than storing one nothing can match", async () => {
      await repoController.update(req({ webhookSecret: "   " }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Repo.update).not.toHaveBeenCalled();
    });

    it("leaves the stored secret untouched when the field is absent", async () => {
      await repoController.update(req({ name: "Renamed" }), res);

      expect(Repo.update.mock.calls[0][0]).not.toHaveProperty("webhookSecret");
    });
  });
});
