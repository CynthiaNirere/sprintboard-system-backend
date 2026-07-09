module.exports = (sequelize, Sequelize, DataTypes) => {
  const Retrospective = sequelize.define("retrospective", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED'),
      allowNull: false,
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: "retrospectives",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  return Retrospective;
};