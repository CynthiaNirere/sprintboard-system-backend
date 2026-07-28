const db = require("../models");
const User = db.user;
const ProjectMember = db.projectMember;

const isProjectAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user && user.globalRole === "ADMIN") {
      return next();
    }

    const projectId = req.params.id;
    const projectMember = await ProjectMember.findOne({
      where: {
        projectId: projectId,
        userId: req.userId,
        projectRole: "PROJECT_ADMIN"
      }
    });

    if (projectMember) {
      return next();
    }

    return res.status(403).send({
      message: "Access denied. Admins or Project Admins only.",
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error checking project admin role.",
    });
  }
};

module.exports = isProjectAdmin;