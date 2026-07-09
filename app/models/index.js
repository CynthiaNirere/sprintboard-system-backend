const dbConfig = require("../config/db.config.js");
const { Sequelize, DataTypes, Model } = require("sequelize");
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

db.user = require("./user.model.js")(sequelize, Sequelize);
db.project = require("./project.model.js")(sequelize, Sequelize);
db.sprint = require("./sprint.model.js")(sequelize, Sequelize);
db.session = require("./session.model.js")(sequelize, Sequelize);

// foreign keys for sprint
db.project.hasMany(db.sprint, {
  as: "sprints",
  foreignKey: { name: "projectId", field: "project_id", allowNull: false },
  onDelete: "CASCADE",
});
db.sprint.belongsTo(db.project, {
  as: "project",
  foreignKey: { name: "projectId", field: "project_id", allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for sessions (auth)
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

module.exports = db;