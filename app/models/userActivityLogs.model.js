module.exports = (sequelize, Sequelize, DataTypes) => {
  const UserActivityLog = sequelize.define("user_activity_log", {
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: "user_activity_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  });

  return UserActivityLog;
};