const { saltSize, keySize } = require("../authentication/crypto");

module.exports = (sequelize, Sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    salt: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    session: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    global_role: {
      type: DataTypes.ENUM('ADMIN', 'USER'),
      allowNull: false,
      defaultValue: 'USER',
    },
    github_account: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  return User;
};
