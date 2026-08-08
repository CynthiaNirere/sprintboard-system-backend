const { saltSize, keySize } = require("../authentication/crypto");

module.exports = (sequelize, Sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    salt: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    globalRole: {
      type: DataTypes.ENUM('ADMIN', 'USER'),
      allowNull: false,
      defaultValue: 'USER',
    },
    githubAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // AES-256-GCM base64 blob produced by crypto.encrypt. Never returned by any
    // endpoint — see the defaultScope below and the exclude lists in
    // user.controller.js.
    githubToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    githubTokenUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: "users",
    timestamps: true,

    // Guards implicit reads only. A query that passes its own `attributes`
    // overrides this entirely, so the explicit exclude lists still matter.
    defaultScope: {
      attributes: { exclude: ["githubToken"] },
    },
    scopes: {
      withGithubToken: {
        attributes: { include: ["githubToken"] },
      },
    }
  });

  return User;
};
