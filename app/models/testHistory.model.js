module.exports = (sequelize, Sequelize, DataTypes) => {
  const TestHistory = sequelize.define("test_history", {
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
  }, {
    tableName: "test_histories",
    timestamps: true,
    updatedAt: false
  });

  return TestHistory;
};