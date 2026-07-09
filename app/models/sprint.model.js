module.exports = (sequelize, Sequelize, DataTypes) => {
  const Sprint = sequelize.define("sprint", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
  }, {
    tableName: "sprints",
    timestamps: true
  });

  return Sprint;
};