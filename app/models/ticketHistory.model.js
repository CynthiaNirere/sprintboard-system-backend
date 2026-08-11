module.exports = (sequelize, Sequelize, DataTypes) => {
  const TicketHistory = sequelize.define("ticket_history", {
    field: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    oldLabel: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newLabel: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
  }, {
    tableName: "ticket_histories",
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "historyForTicket",
        fields: ["ticketId", "field"]
      }
    ]
  });

  return TicketHistory;
};