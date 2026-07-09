module.exports = (sequelize, Sequelize, DataTypes) => {
  const UserActivityLog = sequelize.define("user_activity_log", {
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: "user_activity_logs",
    timestamps: true,
    updatedAt: false
  });

  return UserActivityLog;
};