module.exports = (sequelize, Sequelize, DataTypes) => {
  const TicketHistory = sequelize.define("ticket_history", {
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: "ticket_histories",
    timestamps: true,
    updatedAt: false
  });

  return TicketHistory;
};