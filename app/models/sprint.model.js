module.exports = (sequelize, Sequelize, DataTypes) => {
  const Sprint = sequelize.define("sprint", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  }, {
    tableName: "sprints",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  return Sprint;
};