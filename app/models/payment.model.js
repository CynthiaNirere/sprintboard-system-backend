module.exports = (sequelize, Sequelize, DataTypes, Model) => {
  class Payment extends Model {}

    Payment.init(
      {
        amount: {
          type: DataTypes.DECIMAL(10,2),
          allowNull: false,
        },
        paymentDate:{
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        paymentMethod: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        paymentStatus: {
          type: DataTypes.STRING(25),
          allowNull: false,
        },

      },
      {
        // Other model options go here
        sequelize, // We need to pass the connection instance
        modelName: 'payment', // We need to choose the model name
      },
    );
  return Payment;
};
