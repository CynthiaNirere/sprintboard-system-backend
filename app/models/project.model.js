module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define("project", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    projectUrl: {
      type: Sequelize.STRING,
      allowNull: true,
      field: "project_url",
    },
  });
  return Project;
};