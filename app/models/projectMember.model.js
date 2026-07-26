module.exports = (sequelize, Sequelize, DataTypes) => {
  const ProjectMember = sequelize.define("project_member", {
    projectRole: {
      type: DataTypes.ENUM('PROJECT_ADMIN', 'DEVELOPER'),
      allowNull: false,
    }
  }, {
    tableName: "project_members",
    timestamps: true
  });

  return ProjectMember;
};