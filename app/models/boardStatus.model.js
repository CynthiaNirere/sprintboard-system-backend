module.exports = (sequelize, Sequelize, DataTypes) => {
  const BoardStatus = sequelize.define("board_status", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    columnOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    githubEvent: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "none",
    }
  }, {
    tableName: "board_statuses",
    timestamps: false
  });

  return BoardStatus;
};