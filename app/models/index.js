const dbConfig = require("../config/db.config.js");
const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  // Sequelize logs every statement by default. In production that is the
  // dominant source of container log volume, which is capped but still
  // rotates real disk on a small root volume. App-level logs and errors
  // are unaffected.
  logging: process.env.NODE_ENV === "production" ? false : console.log,
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

db.user = require("./user.model.js")(sequelize, Sequelize, DataTypes);
db.project = require("./project.model.js")(sequelize, Sequelize, DataTypes);
db.projectMember = require("./projectMember.model.js")(sequelize, Sequelize, DataTypes);
db.sprint = require("./sprint.model.js")(sequelize, Sequelize, DataTypes);
db.boardStatus = require("./boardStatus.model.js")(sequelize, Sequelize, DataTypes);
db.ticket = require("./ticket.model.js")(sequelize, Sequelize, DataTypes);
db.test = require("./test.model.js")(sequelize, Sequelize, DataTypes);
db.testHistory = require("./testHistory.model.js")(sequelize, Sequelize, DataTypes);
db.ticketHistory = require("./ticketHistory.model.js")(sequelize, Sequelize, DataTypes);
db.retrospective = require("./retrospective.model.js")(sequelize, Sequelize, DataTypes);
db.retroItem = require("./retroItem.model.js")(sequelize, Sequelize, DataTypes);
db.userActivityLog = require("./userActivityLog.model.js")(sequelize, Sequelize, DataTypes);
db.githubRepository = require("./githubRepository.model.js")(sequelize, Sequelize, DataTypes);
db.comment = require("./comment.model.js")(sequelize, Sequelize, DataTypes);
db.attachment = require("./attachment.model.js")(sequelize, Sequelize, DataTypes);
db.session = require("./session.model.js")(sequelize, Sequelize, DataTypes);

// foreign keys for sprint
db.project.hasMany(db.sprint, {
  as: "projectSprints",
  foreignKey: {
    name: "projectId", 
    allowNull: false 
  },
  onDelete: "CASCADE",
});
db.sprint.belongsTo(db.project, {
  as: "project",
  foreignKey: { 
    name: "projectId", 
    allowNull: false 
  },
  onDelete: "CASCADE",
});

// foreign keys for project
db.user.hasMany(db.project, {
  as: "createdProjects",
  foreignKey: {
    name: "createdBy",
    allowNull: false
  },
});
db.project.belongsTo(db.user, {
  as: "creator",
  foreignKey: {
    name: "createdBy",
    allowNull: false,
  },
});

// foreign keys for githubRepository
db.project.hasMany(db.githubRepository, {
  as: "projectRepositories",
  foreignKey: {
    name: "projectId",
    allowNull: false,
  },
});
db.githubRepository.belongsTo(db.project, {
  as: "project",
  foreignKey: {
    name: "projectId",
    allowNull: false,
  },
});

// foreign keys for boardStatus
db.project.hasMany(db.boardStatus, {
  as: "projectBoardStatuses",
  foreignKey: {
    name: "projectId",
    allowNull: false,
  },
});
db.boardStatus.belongsTo(db.project, {
  as: "project",
  foreignKey: {
    name: "projectId",
    allowNull: false,
  },
});

// foreign keys for ticket
db.user.hasMany(db.ticket, {
  as: "assignedTickets",
  foreignKey: {
    name: "assigneeId",
    allowNull: true,
  },
});
db.ticket.belongsTo(db.user, {
  as: "assignee",
  foreignKey: {
    name: "assigneeId",
    allowNull: true,
  },
});
db.project.hasMany(db.ticket, {
  as: "projectTickets",
  foreignKey: {
    name: "projectId",
    allowNull: false,
  },
});
db.ticket.belongsTo(db.project, {
  as: "project",
  foreignKey: {
    name: "projectId",
    allowNull: false,
  },
});
db.sprint.hasMany(db.ticket, {
  as: "sprintTickets",
  foreignKey: {
    name: "sprintId",
    allowNull: true,
  },
});
db.ticket.belongsTo(db.sprint, {
  as: "sprint",
  foreignKey: {
    name: "sprintId",
    allowNull: true,
  },
});
db.boardStatus.hasMany(db.ticket, {
  as: "boardStatusTickets",
  foreignKey: {
    name: "statusId",
    allowNull: true,
  },
});
db.ticket.belongsTo(db.boardStatus, {
  as: "boardStatus",
  foreignKey: {
    name: "statusId",
    allowNull: true,
  },
});
db.githubRepository.hasMany(db.ticket, {
  as: "githubRepositoryTickets",
  foreignKey: {
    name: "repoId",
    allowNull: true,
  },
});
db.ticket.belongsTo(db.githubRepository, {
  as: "githubRepository",
  foreignKey: {
    name: "repoId",
    allowNull: true,
  },
});

// foreign keys for test
db.user.hasMany(db.test, {
  as: "assignedTests",
  foreignKey: {
    name: "ownerId",
    allowNull: true,
  },
});
db.test.belongsTo(db.user, {
  as: "tester",
  foreignKey: {
    name: "ownerId",
    allowNull: true,
  },
});
db.ticket.hasMany(db.test, {
  as: "ticketTests",
  foreignKey: {
    name: "ticketId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.test.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticketId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// foreign keys for ticketHistory
db.user.hasMany(db.ticketHistory, {
  as: "userTicketHistoryEntries",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
db.ticketHistory.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "userId",
    allowNull: true,
  },
});
db.ticket.hasMany(db.ticketHistory, {
  as: "ticketHistoryEntries",
  foreignKey: {
    name: "ticketId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.ticketHistory.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticketId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// foreign keys for testHistory
db.user.hasMany(db.testHistory, {
  as: "userTestHistoryEntries",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
db.testHistory.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
db.test.hasMany(db.testHistory, {
  as: "testHistoryEntries",
  foreignKey: {
    name: "testId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.testHistory.belongsTo(db.test, {
  as: "test",
  foreignKey: {
    name: "testId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// foreign keys for retrospective
db.sprint.hasOne(db.retrospective, {
  as: "sprintRetrospective",
  foreignKey: {
    name: "sprintId",
    allowNull: false,
  },
});
db.retrospective.belongsTo(db.sprint, {
  as: "sprint",
  foreignKey: {
    name: "sprintId",
    allowNull: false,
  },
});

// foreign keys for retroItem
db.user.hasMany(db.retroItem, {
  as: "userRetroItems",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
db.retroItem.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
db.retrospective.hasMany(db.retroItem, {
  as: "retrospectiveItems",
  foreignKey: {
    name: "retroId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.retroItem.belongsTo(db.retrospective, {
  as: "retrospective",
  foreignKey: {
    name: "retroId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// foreign keys for userActivityLog
db.user.hasMany(db.userActivityLog, {
  as: "userActivities",
  foreignKey: {
    name: "userId",
    allowNull: true,
  },
});
db.userActivityLog.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "userId",
    allowNull: true,
  },
});

// foreign keys for comment
db.user.hasMany(db.comment, {
  as: "userComments",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
db.comment.belongsTo(db.user, {
  as: "user",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
db.ticket.hasMany(db.comment, {
  as: "ticketComments",
  foreignKey: {
    name: "ticketId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.comment.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticketId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.test.hasMany(db.comment, {
  as: "testComments",
  foreignKey: {
    name: "testId",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.comment.belongsTo(db.test, {
  as: "test",
  foreignKey: {
    name: "testId",
    allowNull: true,
  },
  onDelete: "CASCADE",
});

// foreign keys for attachment
db.user.hasMany(db.attachment, {
  as: "uploaderAttachments",
  foreignKey: {
    name: "uploaderId",
    allowNull: false,
  },
});
db.attachment.belongsTo(db.user, {
  as: "uploader",
  foreignKey: {
    name: "uploaderId",
    allowNull: false,
  },
});
db.test.hasMany(db.attachment, {
  as: "testAttachments",
  foreignKey: {
    name: "testId",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.attachment.belongsTo(db.test, {
  as: "test",
  foreignKey: {
    name: "testId",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.ticket.hasMany(db.attachment, {
  as: "ticketAttachments",
  foreignKey: {
    name: "ticketId",
    allowNull: true,
  },
  onDelete: "CASCADE",
});
db.attachment.belongsTo(db.ticket, {
  as: "ticket",
  foreignKey: {
    name: "ticketId",
    allowNull: true,
  },
  onDelete: "CASCADE",
});

// foreign keys for sessions
db.user.hasMany(db.session, {
  as: "userSessions",
  foreignKey: { 
    name: "userId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});
db.session.belongsTo(db.user, {
  as: "user",
  foreignKey: { 
    name: "userId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

// Junction table
db.user.belongsToMany(db.project, {
  through: db.projectMember,
  foreignKey: "userId"
});
db.project.belongsToMany(db.user, {
  through: db.projectMember,
  foreignKey: "projectId"
});

module.exports = db;