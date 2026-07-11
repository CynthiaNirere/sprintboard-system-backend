module.exports = (sequelize, Sequelize, DataTypes) => {
  const Comment = sequelize.define("comment", {
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: "comments",
    timestamps: true,
    updatedAt: false
  });

  return Comment;
};