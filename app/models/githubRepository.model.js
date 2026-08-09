const { parseRepoUrl } = require("../services/githubUrl");

module.exports = (sequelize, Sequelize, DataTypes) => {
  const GithubRepository = sequelize.define("github_repository",{
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // A label for this repository, chosen by whoever linked it. Free text —
    // nothing matches on it, so it is safe to rename at any time.
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    // The GitHub account or organisation that owns the repository, derived
    // from url.
    owner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // The GitHub repository slug, derived from url. Webhook deliveries are
    // matched on { owner, repoSlug }, so this has to be the real thing —
    // which is why it is kept apart from the display name above.
    repoSlug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    developmentBranch:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Shared secret GitHub signs webhook deliveries with, stored AES-256-GCM
    // encrypted. Write-only: no endpoint ever returns it, so a lost secret is
    // replaced rather than recovered.
    webhookSecret: {
      type: DataTypes.STRING(512),
      allowNull: true,
    }
  }, {
    tableName: "github_repositories",
    timestamps: true,

    indexes: [
      { name: "idx_github_repos_owner_slug", fields: ["owner", "repoSlug"] },
    ],

    // Guards implicit reads only — a query passing its own `attributes`
    // overrides this, so read paths still exclude the secret explicitly.
    defaultScope: {
      attributes: { exclude: ["webhookSecret"] },
    },
    scopes: {
      withWebhookSecret: {
        attributes: { include: ["webhookSecret"] },
      },
    }
  });

  // Keep the derived pair in step with url. `name` is deliberately untouched —
  // it belongs to the user. Business rules live in model hooks here (see the
  // overlap check in sprint.model.js).
  GithubRepository.addHook("beforeValidate", (repo) => {
    const parsed = parseRepoUrl(repo.url);
    if (parsed) {
      repo.owner = parsed.owner;
      repo.repoSlug = parsed.repoName; // parseRepoUrl's key, not the column name
    }
  });

  return GithubRepository;
};
