module.exports = (sequelize, Sequelize, DataTypes) => {
  const TicketComment = sequelize.define("ticket_comment", {
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: "ticket_comments",
    timestamps: true,
    updatedAt: false
  });

  return TicketComment;
};