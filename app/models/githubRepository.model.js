module.exports = (sequelize, Sequelize, DataTypes) => {
  const GithubRepository = sequelize.define("github_repository",{
    repo_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    repo_name: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: "github_repositories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  return GithubRepository;
};