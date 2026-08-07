module.exports = (sequelize, Sequelize, DataTypes) => {
  const GithubRepository = sequelize.define("github_repository",{
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    developmentBranch:{
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: "github_repositories",
    timestamps: true
  });

  return GithubRepository;
};