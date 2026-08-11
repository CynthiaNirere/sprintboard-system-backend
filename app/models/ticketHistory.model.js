module.exports = (sequelize, Sequelize, DataTypes) => {
  const TicketHistory = sequelize.define("ticket_history", {
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
  }, {
    tableName: "ticket_histories",
    timestamps: true,
    updatedAt: false
  });
  return TicketHistory;
};
