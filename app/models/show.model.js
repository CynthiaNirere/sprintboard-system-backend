module.exports = (sequelize, Sequelize) => {
    const Show = sequelize.define("show", {
        title: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        speakerInfo: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
        },
    });
    return Show;
};