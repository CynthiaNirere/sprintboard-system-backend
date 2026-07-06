module.exports = (sequelize, Sequelize) => {
    const Waitlist = sequelize.define("waitlist",{
        waitlistDate:{
            type: Sequelize.DATE,
            allowNull: false,
        },
        notificationSent: {
            type: Sequelize.STRING(20),
            allowNull: false,
        },
    });
    return Waitlist;
};