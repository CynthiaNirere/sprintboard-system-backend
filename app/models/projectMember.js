module.exports = (sequelize, Sequelize, DataTypes) => {
  const ProjectMember = sequelize.define("project_member", {
    project_role: {
      type: DataTypes.ENUM('PROJECT ADMIN', 'SCRUM MASTER', 'DEVELOPER', 'QA_TESTER'),
      allowNull: false,
      defaultValue: 'DEVELOPER'
    }
  }, {
    tableName: "project_members",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updatedAt"
  });

  return ProjectMember;
};