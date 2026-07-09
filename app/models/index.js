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
db.projectMember = require("./projectMember.model.js")(sequelize, Sequelize);
db.sprint = require("./sprint.model.js")(sequelize, Sequelize);
db.boardStatus = require("./boardStatus.model.js")(sequelize, Sequelize);
db.ticket = require("./ticket.model.js")(sequelize, Sequelize);
db.test = require("./test.model.js")(sequelize, Sequelize);
db.ticketHistory = require("./ticketHistory.model.js")(sequelize, Sequelize);
db.retrospective = require("./retrospective.model.js")(sequelize, Sequelize);
db.retroItem = require("./retroItem.model.js")(sequelize, Sequelize);
db.userActivityLog = require("./userActivityLog.model.js")(sequelize, Sequelize);
db.githubRepository = require("./githubRepository.model.js")(sequelize, Sequelize);
db.ticketComment = require("./ticketComment.model.js")(sequelize, Sequelize);
db.attachment = require("./attachment.model.js")(sequelize, Sequelize);

// foreign keys for sprint
db.project.hasMany(db.sprint, {
  as: "sprints",
  foreignKey: { name: "projectId", field: "project_id", allowNull: false },
    onDelete: "CASCADE",
});
// foreign keys for project
db.user.hasMany(db.project, {
  as: "createdProjects",
  foreignKey: {
    name: "created_by",
    allowNull: false
  },
});
db.sprint.belongsTo(db.project, {
  as: "project",
  foreignKey: { name: "projectId", field: "project_id", allowNull: false },
   onDelete: "CASCADE",
});
db.project.belongsTo(db.user, {
  as: "creator",
  foreignKey: {
    name: "created_by",
    allowNull: false,
  },
});
db.sprint.belongsTo(db.project, {
  as: "project",
  foreignKey: { name: "projectId", field: "project_id", allowNull: false },
  onDelete: "CASCADE",
});

// foreign keys for ticket
db.user.hasMany(db.ticket, {
  as: "assignedTickets",
  foreignKey: {
    name: "assignee_id",
    allowNull: true,
  },
});
db.ticket.belongsTo(db.user, {
  as: "assignee",
  foreignKey: {
    name: "assignee_id",
    allowNull: true,
  },
});
db.project.hasMany(db.ticket, {
  as: "projectTickets",
  foreignKey: {
    name: "project_id",
    allowNull: false,
  },
});
db.ticket.belongsTo(db.project, {
  as: "project",
  foreignKey: {
    name: "project_id",
    allowNull: false,
  },
});
db.sprint.hasMany(db.ticket, {
  as: "sprintTickets",
  foreignKey: {
    name: "sprint_id",
    allowNull: true,
  },
});
db.ticket.belongsTo(db.sprint, {
  as: "sprint",
  foreignKey: {
    name: "sprint_id",
    allowNull: true,
  },
});
db.boardStatus.hasMany(db.ticket, {
  as: "boardStatusTickets",
  foreignKey: {
    name: "status_id",
    allowNull: false,
  },
});
db.ticket.belongsTo(db.boardStatus, {
  as: "boardStatus",
  foreignKey: {
    name: "status_id",
    allowNull: false,
  },
});

// foreign keys for test
db.user.hasMany(db.test, {
  as: "assignedTests",
  foreignKey: {
    name: "owner_id",
    allowNull: true,
  },
});
db.test.belongsTo(db.user, {
  as: "tester",
  foreignKey: {
    name: "owner_id",
    allowNull: true,
  },
});
db.ticket.hasMany(db.test, {
  as: "ticketTests",
  foreignKey: {
    name: "ticket_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.test.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticket_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// foreign keys for ticketHistory
db.user.hasMany(db.ticketHistory, {
  as: "userTicketHistoryEntries",
  foreignKey: {
    name: "user_id",
    allowNull: false,
  },
});
db.ticketHistory.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "user_id",
    allowNull: false,
  },
});
db.ticket.hasMany(db.ticketHistory, {
  as: "ticketHistoryEntries",
  foreignKey: {
    name: "ticket_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.ticketHistory.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticket_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// foreign keys for retrospective
db.sprint.hasOne(db.retrospective, {
  as: "sprintRetrospective",
  foreignKey: {
    name: "sprint_id",
    allowNull: false,
  },
});
db.retrospective.belongsTo(db.sprint, {
  as: "sprint",
  foreignKey: {
    name: "sprint_id",
    allowNull: false,
  },
});

// foreign keys for retroItem
db.user.hasMany(db.retroItem, {
  as: "userRetroItems",
  foreignKey: {
    name: "user_id",
    allowNull: false,
  },
});
db.retroItem.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "user_id",
    allowNull: false,
  },
});
db.retrospective.hasMany(db.retroItem, {
  as: "retrospectiveItems",
  foreignKey: {
    name: "retro_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.retroItem.belongsTo(db.retrospective, {
  as: "retrospective",
  foreignKey: {
    name: "retro_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// foreign keys for userActivityLog
db.user.hasMany(db.userActivityLog, {
  as: "userActivities",
  foreignKey: {
    name: "user_id",
    allowNull: true,
  },
});
db.userActivityLog.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "user_id",
    allowNull: true,
  },
});

// foreign keys for ticketComment
db.user.hasMany(db.ticketComment, {
  as: "userTicketComments",
  foreignKey: {
    name: "user_id",
    allowNull: false,
  },
});
db.ticketComment.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "user_id",
    allowNull: false,
  },
});
db.ticket.hasMany(db.ticketComment, {
  as: "ticketComments",
  foreignKey: {
    name: "ticket_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.ticketComment.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticket_id",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.test.hasMany(db.ticketComment, {
  as: "testComments",
  foreignKey: {
    name: "test_id",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.ticketComment.belongsTo(db.test, {
  as: "test",
  foreignKey: {
    name: "test_id",
    allowNull: true,
  },
  onDelete: "CASCADE",
});

// foreign keys for attachment
db.user.hasMany(db.attachment, {
  as: "uploaderAttachments",
  foreignKey: {
    name: "uploader_id",
    allowNull: false,
  },
});
db.attachment.belongsTo(db.user, {
  as: "uploader",
  foreignKey: {
    name: "uploader_id",
    allowNull: false,
  },
});
db.test.hasMany(db.attachment, {
  as: "testAttachments",
  foreignKey: {
    name: "test_id",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.attachment.belongsTo(db.test, {
  as: "test",
  foreignKey: {
    name: "test_id",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.ticket.hasMany(db.attachment, {
  as: "ticketAttachments",
  foreignKey: {
    name: "ticket_id",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.attachment.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticket_id",
    allowNull: true,
  },
  onDelete: "CASCADE",
});

// Junction table
db.user.belongsToMany(db.project, {
  through: db.projectMember,
  foreignKey: "user_id"
});
db.project.belongsToMany(db.user, {
  through: db.projectMember,
  foreignKey: "project_id"
});

module.exports = db;