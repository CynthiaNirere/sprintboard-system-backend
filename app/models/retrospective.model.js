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
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: "retrospectives",
    timestamps: true
  });

  return Retrospective;
};