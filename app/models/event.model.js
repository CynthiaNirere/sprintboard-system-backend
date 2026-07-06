module.exports= (sequelize, Sequelize) =>{
    const Event = sequelize.define("event", {
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        startTime: {
            type: Sequelize.TIME,
            allowNull: false,
        },
        endTime: {
            type:Sequelize.TIME,
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM('Scheduled', 'Cancelled' , 'Completed'),
            allowNull: false,
            defaultValue: 'Scheduled',
        },
        capacity: {
            type: Sequelize.INTEGER,
            allowNull: false,
        }
    });
        
    return Event;
}