module.exports = (sequelize, Sequelize, DataTypes) => {
  const ProjectMember = sequelize.define("project_member", {
    projectRole: {
      type: DataTypes.ENUM('PROJECT_ADMIN', 'DEVELOPER', 'QA_TESTER'),
      allowNull: false,
    }
  }, {
    tableName: "project_members",
    timestamps: true
  });

  return ProjectMember;
};