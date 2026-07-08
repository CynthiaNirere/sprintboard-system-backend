module.exports = (sequelize, Sequelize, DataTypes) => {
  const Test = sequelize.define("test", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PASSED', 'FAILED', 'BLOCKED'),
      allowNull: false,
      defaultValue: 'PENDING',
    }
  }, {
    tableName: "tests",
    timestamps: true,
    createdAt: "created_at",
    updatedat: "updated_at"
  });

  return Test;
};