module.exports=(sequelize, Sequelize) =>{
    const Reservation = sequelize.define("reservation", {
        reservationTime:{
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        expirationTime:{
            type: Sequelize.DATE,
            allowNull: false
        },
        reservationStatus:{
            type: Sequelize.ENUM('pending', 'confirmed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending'
        }
    });
    return Reservation;
}