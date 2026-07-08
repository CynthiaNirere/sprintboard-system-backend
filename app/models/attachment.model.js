module.exports = (sequelize, Sequelize, DataTypes) => {
  const Attachment = sequelize.define("attachment", {
    file_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: "attachments",
    timestamps: true,
    createdAt: "uploaded_at",
    updatedAt: false
  });

  return Attachment;
};