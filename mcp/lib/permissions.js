const db = require("../../app/models");

async function isProjectAdminOrGlobalAdmin(userId, projectId) {
  const user = await db.user.findByPk(userId);
  if (user?.globalRole === "ADMIN") return true;

  const membership = await db.projectMember.findOne({
    where: { userId, projectId, projectRole: "PROJECT_ADMIN" },
  });
  return !!membership;
}

async function isGlobalAdmin(userId) {
  const user = await db.user.findByPk(userId);
  return user?.globalRole === "ADMIN";
}

module.exports = { isProjectAdminOrGlobalAdmin, isGlobalAdmin };