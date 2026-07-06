module.exports =(sequelize, Sequelize) => {
    const Notification = sequelize.define("notification",{
          message:{
            type: Sequelize.STRING(225),
            allowNull: false,
          },
        dateSent:{
            type: Sequelize.DATE,
            allowNull:false,
        },
    });
     return Notification; 

};