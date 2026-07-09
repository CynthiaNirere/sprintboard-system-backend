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
    storyPoints: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    githubBranchName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    githubPrURL: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: "tickets",
    timestamps: true
  });

  return Ticket;
};