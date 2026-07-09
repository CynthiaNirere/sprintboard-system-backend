module.exports = (sequelize, Sequelize) => {
  const Sprint = sequelize.define("sprint", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      field: "start_date",
    },
    endDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      field: "end_date",
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
  });
  return Sprint;
};