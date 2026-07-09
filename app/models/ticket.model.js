module.exports = (sequelize, Sequelize, DataTypes) => {
  const Ticket = sequelize.define("ticket", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('TASK', 'NEW FEATURE', 'ENHANCEMENT', 'BUG'),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      allowNull: false,
    },
    story_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    github_branch_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    github_pr_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: "tickets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  return Ticket;
};