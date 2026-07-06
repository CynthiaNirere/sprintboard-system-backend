const { saltSize, keySize } = require("../authentication/crypto");

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: Sequelize.BLOB,
      allowNull: false,
    },
    salt: {
      type: Sequelize.BLOB,
      allowNull: false,
    },
    phoneNumber:{
      type: Sequelize.STRING(255),
      allowNull:true,
    },
    dateCreated: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    userType: {
      type: Sequelize.ENUM('admin', 'customer'),
      allowNull: true,
      defaultValue: 'customer',
    },

  });

  return User;
};
