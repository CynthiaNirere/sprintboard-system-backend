module.exports = (sequelize, Sequelize, DataTypes) => {
  const RetroItem = sequelize.define("retro_item", {
    itemType: {
      type: DataTypes.ENUM('WHAT_WENT_WELL', 'WHAT_DID_NOT_GO_WELL', 'NEEDS_IMPROVEMENT'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
  }, {
    tableName: "retro_items",
    timestamps: true
  });

  return RetroItem;
};