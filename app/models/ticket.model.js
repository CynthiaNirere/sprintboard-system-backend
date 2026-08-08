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
      type: DataTypes.ENUM('FEATURE', 'ENHANCEMENT', 'BUG'),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      allowNull: false,
    },
    storyPoints: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isIn: {
          args: [[0, 1, 2, 3, 5, 8, 13, 21, 34, 55]],
          msg: "Story points must be a valid Fibonacci number!"
        }
      }
    },
    // The branch name to use. Set it to choose your own; leave it empty and the
    // automation generates one from the ticket type, id and title.
    githubBranchName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Stamped once the branch has actually been cut on GitHub. This is what
    // makes the automation idempotent — githubBranchName alone cannot say
    // whether a branch exists yet or is merely the one somebody asked for.
    githubBranchCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    githubPrURL: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    githubIssueNumber: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: "tickets",
    timestamps: true
  });

  return Ticket;
};