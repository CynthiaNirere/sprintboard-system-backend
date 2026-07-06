const db = require("../models");

const isAdmin = async (req, res, next) => {
try{
  const user = await db.user.findByPk(req.userId);
  if (user.userType == "admin") {
    next(); 
  } else {
    return res.status(403).send({message: "Access denied.Just Admins Only"});
  }
} catch (err) {
    return res.status(500).send({message: "Error checking User role"});
  }
};

module.exports = isAdmin;