module.exports = (sequelize, Sequelize, DataTypes) => {
  const TicketHistory = sequelize.define("ticket_history", {
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    old_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: "ticket_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  });

  return TicketHistory;
};