require("dotenv").config();

const db = require("../app/models");
const { getSalt, hashPassword } = require("../app/authentication/crypto");

const args = process.argv.slice(2);
const help = args.includes("--help") || args.includes("-h");
const wipe = args.includes("--wipe") || args.includes("--force") || !args.includes("--no-wipe");

if (help) {
  console.log("Usage: node scripts/init-db.js [--no-wipe] [--help]");
  console.log("  --no-wipe   Preserve existing tables and only sync without dropping them.");
  console.log("  --wipe      Drop and recreate all tables before seeding (default).");
  process.exit(0);
}

const run = async () => {
  try {
    console.log(`Syncing database${wipe ? " (force=true)" : ""}...`);
    await db.sequelize.sync(wipe ? { force: true } : {});
    console.log("Database synced.");

    const salt = await getSalt();
    const passwordHash = await hashPassword("Test1234!", salt);
    const password = await hashPassword("password", salt);


    console.log("Seeding users...");
    const adminUser = await db.user.create({
      firstName: "Admin",
      lastName: "User",
      email: "test.admin@example.com", 
      password: passwordHash,
      salt: salt,
      globalRole: "ADMIN",
    });

    const projectAdminUser = await db.user.create({
      firstName: "Project",
      lastName: "Admin",
      email: "test.projectadmin@example.com", 
      password: passwordHash,
      salt: salt,
      globalRole: "USER",
    });

    const user = await db.user.create({
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com", 
      password: passwordHash,
      salt: salt,
      globalRole: "USER",
    });

    const me = await db.user.create({
      firstName: "me",
      lastName: "me",
      email: "me@gmail.com", 
      password: password,
      salt: salt,
      globalRole: "USER",
    });

    console.log("Seeding project...");
    const seedProject = await db.project.bulkCreate([
      {
      id: 1,
      name: "Test Project admin",
      description: "Initial seeded project from admin init DB",
      createdBy: adminUser.id
      },
      {
      id: 2,
      name: "Test Project user",
      description: "Initial seeded project for user from init DB",
      createdBy: user.id
      },
      {
      id: 3,
      name: "Test Project me",
      description: "Initial seeded project for me from init DB",
      createdBy: me.id
    },
    {
      id: 4,
      name: "Test Project me 2",
      description: "Initial seeded project for me from init DB",
      createdBy: me.id
    }
  ]);

    console.log("Seeding project members...");
    await db.projectMember.bulkCreate([
      {
        userId: projectAdminUser.id,
        projectId: 1,
        projectRole: "PROJECT_ADMIN",
      },
      {
        userId: user.id,
        projectId: 2,
        projectRole: "DEVELOPER",
      },
      {
        userId: me.id,
        projectId: 3,
        projectRole: "PROJECT_ADMIN",
      },
      {
        userId: me.id,
        projectId: 4,
        projectRole: "PROJECT_ADMIN",
      },
    ]);

    console.log("Seeding board statuses...");
    await db.boardStatus.bulkCreate([
      {
        name: "No Status",
        columnOrder: 1,
        projectId: 1
      },
      {
        name: "In Progress",
        columnOrder: 2,
        projectId: 1
      },
      {
        name: "Ready for Test",
        columnOrder: 3,
        projectId: 1
      },
      {
        name: "In Test",
        columnOrder: 4,
        projectId: 1
      },
      {
        name: "Done",
        columnOrder: 5,
        projectId: 1
      },
      {
        name: "No Status",
        columnOrder: 1,
        projectId: 2
      },
      {
        name: "In Progress",
        columnOrder: 2,
        projectId: 2
      },
      {
        name: "Ready for Test",
        columnOrder: 3,
        projectId: 2
      },
      {
        name: "In Test",
        columnOrder: 4,
        projectId: 2
      },
      {
        name: "Done",
        columnOrder: 5,
        projectId: 2
      },
      {
        name: "No Status",
        columnOrder: 1,
        projectId: 3
      },
      {
        name: "In Progress",
        columnOrder: 2,
        projectId: 3
      },
      {
        name: "Ready for Test",
        columnOrder: 3,
        projectId: 3
      },
      {
        name: "In Test",
        columnOrder: 4,
        projectId: 3
      },
      {
        name: "Done",
        columnOrder: 5,
        projectId: 3
      },
      {
        name: "No Status",
        columnOrder: 1,
        projectId: 4
      },
      {
        name: "In Progress",
        columnOrder: 2,
        projectId: 4
      },
      {
        name: "Ready for Test",
        columnOrder: 3,
        projectId: 4
      },
      {
        name: "In Test",
        columnOrder: 4,
        projectId: 4
      },
      {
        name: "Done",
        columnOrder: 5,
        projectId: 4
      },
    ]);

    console.log("Seeding sprints...");
    const today = new Date();
    const twoWeeksFromToday = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const fourWeeksFromToday = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const seedSprint = await db.sprint.bulkCreate([
      {
      name: "Seeded Sprint 1",
      startDate: today,
      endDate: twoWeeksFromToday,
      isActive: true,
      projectId: 1
    },
    {
      name: "Seeded Sprint 2",
      startDate: twoWeeksFromToday,
      endDate: fourWeeksFromToday,
      isActive: true,
      projectId: 1
    },
    {
      name: "Seeded Sprint 1",
      startDate: today,
      endDate: twoWeeksFromToday,
      isActive: true,
      projectId: 2
    },
    {
      name: "Seeded Sprint 2",
      startDate: twoWeeksFromToday,
      endDate: fourWeeksFromToday,
      isActive: true,
      projectId: 2
    },
    {
      name: "Seeded Sprint 1",
      startDate: today,
      endDate: twoWeeksFromToday,
      isActive: true,
      projectId: 3
    },
    {
      name: "Seeded Sprint 2",
      startDate: twoWeeksFromToday,
      endDate: fourWeeksFromToday,
      isActive: true,
      projectId: 3
    },
    {
      name: "Seeded Sprint 1",
      startDate: today,
      endDate: twoWeeksFromToday,
      isActive: true,
      projectId: 4
    },
    {
      name: "Seeded Sprint 2",
      startDate: twoWeeksFromToday,
      endDate: fourWeeksFromToday,
      isActive: true,
      projectId: 4
    },
  ]);

  await db.ticket.bulkCreate([
    {
        "title": "None",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 1,
        "sprintId": 1,
        "statusId": 1,
    },
    {
        "title": "In Progress",
        "description": "Sample Description",
        "type": "BUG",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 1,
        "sprintId": 1,
        "statusId": 2,
    },
    {
        "title": "Ready For Test",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 1,
        "sprintId": 1,
        "statusId": 3,
    },
    {
        "title": "In Test",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 1,
        "sprintId": 1,
        "statusId": 4,
    },
    {
        "title": "Done",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 1,
        "sprintId": 1,
        "statusId": 5,
    },
    {
        "title": "None",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 3,
        "sprintId": 5,
        "statusId": 11,
    },
    {
        "title": "In Progress",
        "description": "Sample Description",
        "type": "BUG",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 3,
        "sprintId": 5,
        "statusId": 12,
    },
    {
        "title": "Ready For Test",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 3,
        "sprintId": 5,
        "statusId": 13,
    },
    {
        "title": "In Test",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 3,
        "sprintId": 5,
        "statusId": 14,
    },
    {
        "title": "Done",
        "description": "Sample Description",
        "type": "FEATURE",
        "priority": "MEDIUM",
        "storyPoints": 2,
        "projectId": 3,
        "sprintId": 5,
        "statusId": 15,
    },
  ]);

    console.log("Seeding user sessions...");
    const adminSession = await db.session.create({
      email: adminUser.email,
      userId: adminUser.id,
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const projectAdminSession = await db.session.create({
      email: projectAdminUser.email,
      userId: projectAdminUser.id,
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const userSession = await db.session.create({
      email: user.email,
      userId: user.id,
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    console.log("Seed data created:", {
      adminId: adminUser.id,
      projectAdminUserId: projectAdminUser.id,
      userId: user.id,
      projectId: 1,
      sprintId: 1,
      adminSessionId: adminSession.id,
      projectAdminSessionId: projectAdminSession.id,
      userSessionId: userSession.id,
    });

    const foundProject = await db.project.findByPk(1, {
      include: [
        {
          model: db.boardStatus,
          as: "projectBoardStatuses",
        },
      ],
    });

    console.log("Found project with statuses:", {
      id: foundProject.id,
      name: foundProject.name,
      statusCount: foundProject.projectBoardStatuses.length,
    });

    await db.project.update(
      { name: "Seeded Project" },
      { where: { id: 1 } }
    );
    const updatedProject = await db.project.findByPk(1);
    console.log("Updated project name:", updatedProject.name);

    await db.session.destroy({ where: { id: userSession.id } });
    const deletedSession = await db.session.findByPk(userSession.id);
    console.log("Deleted session exists?", !!deletedSession);

    const foundAdminSession = await db.session.findByPk(adminSession.id);
    console.log("Found session:", {
      id: foundAdminSession.id,
      adminId: foundAdminSession.userId,
      expirationDate: foundAdminSession.expirationDate,
    });

    console.log("Init + CRUD verification complete.");
    process.exit(0);
  } catch (error) {
    console.error("Init/verify failed:", error);
    process.exit(1);
  }
};

run();