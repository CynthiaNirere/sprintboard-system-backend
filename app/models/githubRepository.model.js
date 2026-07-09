module.exports = (sequelize, Sequelize, DataTypes) => {
  const GithubRepository = sequelize.define("github_repository",{
    repoURL: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    repoName: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: "github_repositories",
    timestamps: true
  });

  return GithubRepository;
};