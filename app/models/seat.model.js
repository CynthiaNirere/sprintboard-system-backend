module.exports = (sequelize, Sequelize) => {
    const Seat = sequelize.define("seat", {
        seatNumber: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        rowNumber: {
            type: Sequelize.STRING(25),
            allowNull: false,
        },
        isHandicap: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
        },
        seatStatus: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['seatNumber', 'rowNumber']
                }
        ]

    },
);
    return Seat;
};