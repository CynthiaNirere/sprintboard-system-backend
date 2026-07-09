module.exports = (sequelize, Sequelize, DataTypes) => {
  const ProjectMember = sequelize.define("project_member", {
    project_role: {
      type: DataTypes.ENUM('PROJECT_ADMIN', 'DEVELOPER', 'QA_TESTER'),
      allowNull: false,
    }
  }, {
    tableName: "project_members",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updatedAt"
  });

  return ProjectMember;
};