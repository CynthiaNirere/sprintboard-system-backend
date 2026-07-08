module.exports = (sequelize, Sequelize, DataTypes) => {
  const RetroItem = sequelize.define("retro_item", {
    item_type: {
      type: DataTypes.ENUM('WHAT_WENT_WELL', 'NEEDS_IMPROVEMENT', 'ACTION_ITEM'),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: "retro_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  return RetroItem;
};