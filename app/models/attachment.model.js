module.exports = (sequelize, Sequelize, DataTypes) => {
  const Attachment = sequelize.define("attachment", {
    fileURL: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: "attachments",
    timestamps: true,
    createdAt: "uploadedAt",
    updatedAt: false
  });

  return Attachment;
};