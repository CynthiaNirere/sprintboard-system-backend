const dbConfig = require("../config/db.config.js");
const {Sequelize, DataTypes, Model} = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.event = require("./event.model.js")(sequelize, Sequelize);
db.reservationSeat = require("./reservationSeat.model.js")(sequelize, Sequelize);
db.reservation= require("./reservation.model.js")(sequelize, Sequelize);
db.session = require("./session.model.js")(sequelize, Sequelize);
db.user = require("./user.model.js")(sequelize, Sequelize);
db.ticket = require("./ticket.model.js")(sequelize, Sequelize);
db.seat = require("./seat.model.js")(sequelize, Sequelize);
db.show = require("./show.model.js")(sequelize, Sequelize);
db.waitlist = require("./waitlist.model.js")(sequelize, Sequelize);
db.notification = require("./notification.model.js")(sequelize, Sequelize);
db.payment = require("./payment.model.js")(sequelize, Sequelize, DataTypes, Model);
db.refund = require("./refund.model.js")(sequelize, Sequelize, DataTypes, Model);
db.order = require("./order.model.js")(sequelize, Sequelize, DataTypes);

// foreign keys for ticket
db.payment.hasMany(db.ticket, {
  as: "paymentTickets",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.ticket.belongsTo(db.payment, {
  as: "payment",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.event.hasMany(db.ticket, {
  as: "eventTickets",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.ticket.belongsTo(db.event, {
  as: "event",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.order.hasMany(db.ticket, {
  as: "orderTickets",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.ticket.belongsTo(db.order, {
  as: "order",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for ticket
db.seat.hasMany(db.ticket, {
  as: "seatTickets",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.ticket.belongsTo(db.seat, {
  as: "seat",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for reservationSeat
db.reservation.hasMany(db.reservationSeat, {
  as: "reservationSeats",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.reservationSeat.belongsTo(db.reservation, {
  as: "reservation",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.seat.hasMany(db.reservationSeat, {
  as: "seatReservations",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.reservationSeat.belongsTo(db.seat, {
  as: "seat",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for reservation
db.user.hasMany(db.reservation, {
  as: "userReservations",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.reservation.belongsTo(db.user, {
  as: "user",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.event.hasMany(db.reservation, {
  as: "eventReservations",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.reservation.belongsTo(db.event, {
  as: "event",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for event
db.show.hasMany(db.event, {
  as: "showEvents",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
})
db.event.belongsTo(db.show, {
  as: "show",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
})

// foreign keys for waitlist
db.user.hasMany(db.waitlist, {
  as: "userWaitlists",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.waitlist.belongsTo(db.user, {
  as: "user",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.event.hasMany(db.waitlist, {
  as: "eventWaitlists",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.waitlist.belongsTo(db.event, {
  as: "event",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for notification
db.user.hasMany(db.notification, {
  as: "userNotifications",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.notification.belongsTo(db.user, {
  as: "user",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for sessions
db.user.hasMany(db.session, {
  as: "userSessions",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.session.belongsTo(db.user, {
  as: "user",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for payment
db.user.hasMany(db.payment, {
  as: "userPayments",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.payment.belongsTo(db.user, {
  as: "user",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.order.hasMany(db.payment, {
  as: "orderPayments",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});
db.payment.belongsTo(db.order, {
  as: "order",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for refund
db.payment.hasMany(db.refund, {
  as: "refunds",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.refund.belongsTo(db.payment, {
  as: "payment",
  foreignKey: { allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for order
db.user.hasMany(db.order, {
  as: "orders",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});
db.order.belongsTo(db.user, {
  as: "user",
  foreignKey: { allowNull: true },
  onDelete: "CASCADE",
});

module.exports = db;