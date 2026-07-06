module.exports = (sequelize, Sequelize, DataTypes) => {
  const Order = sequelize.define("order", {
    totalAmount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    orderStatus: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }
);
  return Order;
};