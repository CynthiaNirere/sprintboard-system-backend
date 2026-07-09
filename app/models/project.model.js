module.exports = (sequelize, Sequelize, DataTypes) => {
  const Project = sequelize.define("project", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: "projects",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  return Project;
};