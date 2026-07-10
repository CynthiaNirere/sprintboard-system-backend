const db = require("../models");
const User = db.user;

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user && user.globalRole === "ADMIN") {
      return next();
    }
    return res.status(403).send({
      message: "Access denied. Admins only.",
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error checking admin role.",
    });
  }
};

module.exports = isAdmin;