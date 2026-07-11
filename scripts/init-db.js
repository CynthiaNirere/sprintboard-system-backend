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

    console.log("Seeding project...");
    const seedProject = await db.project.create({
      name: "Test Project",
      description: "Initial seeded project from init DB",
      createdBy: adminUser.id
    });

    console.log("Seeding project members...");
    await db.projectMember.bulkCreate([
      {
        userId: projectAdminUser.id,
        projectId: seedProject.id,
        projectRole: "PROJECT_ADMIN",
      },
      {
        userId: user.id,
        projectId: seedProject.id,
        projectRole: "DEVELOPER",
      },
    ]);

    console.log("Seeding board statuses...");
    await db.boardStatus.bulkCreate([
      {
        name: "No Status",
        columnOrder: 1,
        projectId: seedProject.id
      },
      {
        name: "In Progress",
        columnOrder: 2,
        projectId: seedProject.id
      },
      {
        name: "Ready for Test",
        columnOrder: 3,
        projectId: seedProject.id
      },
      {
        name: "In Test",
        columnOrder: 4,
        projectId: seedProject.id
      },
      {
        name: "Done",
        columnOrder: 5,
        projectId: seedProject.id
      },
    ]);

    console.log("Seeding sprints...");
    const today = new Date();
    const twoWeeksFromToday = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const seedSprint = await db.sprint.create({
      name: "Seeded Sprint 1",
      startDate: today,
      endDate: twoWeeksFromToday,
      isActive: true,
      projectId: seedProject.id
    });

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
      projectId: seedProject.id,
      sprintId: seedSprint.id,
      adminSessionId: adminSession.id,
      projectAdminSessionId: projectAdminSession.id,
      userSessionId: userSession.id,
    });

    const foundProject = await db.project.findByPk(seedProject.id, {
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
      { where: { id: seedProject.id } }
    );
    const updatedProject = await db.project.findByPk(seedProject.id);
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