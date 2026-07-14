const db = require("../models");
const User = db.user;

const selfOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user && user.globalRole === "ADMIN" || (req.userId.toString() === req.params.id)) {
      return next();
    }
    return res.status(403).send({
      message: "Access denied. Admins or account owners only.",
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error checking admin or account owner role.",
    });
  }
};

module.exports = selfOrAdmin;