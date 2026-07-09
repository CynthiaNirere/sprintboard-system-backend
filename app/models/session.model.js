module.exports = (sequelize, Sequelize, DataTypes) => {
  const Session = sequelize.define("session", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: "sessions",
    timestamps: true
  });

  return Session;
};