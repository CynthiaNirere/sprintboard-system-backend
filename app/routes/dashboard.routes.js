module.exports = (app) => {
    const dashboard = require("../controllers/dashboard.controller.js");
    const { authenticateRoute } = require("../authentication/authentication");
    const isAdmin  = require("../middleware/isAdmin");
    var router = require("express").Router();
    
    router.get("/dashboard/stats", [authenticateRoute, isAdmin], dashboard.getStats);
    router.get("/dashboard/report", [authenticateRoute, isAdmin], dashboard.getReport);
    app.use("/museumapi", router);
};