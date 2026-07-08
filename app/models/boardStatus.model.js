module.exports = (sequelize, Sequelize, DataTypes) => {
  const BoardStatus = sequelize.define("board_status", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    column_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    tableName: "board_statuses",
    timestamps: false
  });

  return BoardStatus;
};