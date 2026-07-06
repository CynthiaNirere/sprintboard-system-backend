module.exports = (sequelize, Sequelize, DataTypes, Model) => {
  class Refund extends Model {}

    Refund.init(
      {
        requestDate:{
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        processedDate:{
          type: DataTypes.DATE,
          allowNull: true,
        },
        refundStatus: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        reason: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        details: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
      },
      {
        sequelize, // We need to pass the connection instance
        modelName: 'refund', 
      },
    );
  return Refund;
};