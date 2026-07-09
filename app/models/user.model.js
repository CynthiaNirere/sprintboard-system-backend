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
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: "users",
    timestamps: true
  });

  return User;
};
