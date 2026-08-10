require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const db = require("./app/models");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");

const startServer = async () => {
  try {
    // Keep this false. A failed ALTER against an existing schema logs
    // "DB sync failed:" and exits, which is indistinguishable from a
    // connection failure. Bare sync() still creates missing tables.
    await db.sequelize.sync({ alter: false }); // flip to true once, locally, when models change
    console.log("Database synced.");

    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
      });
    }
  } catch (err) {
    console.error("DB sync failed:", err);
    process.exit(1);
  }
};

var corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:8081",
};

app.use(cors(corsOptions));
app.options("*", cors());

// parse requests of content-type - application/json
app.use(express.json({
  // GitHub pull_request payloads routinely exceed the 100kb default.
  limit: "1mb",
  // The GitHub webhook signature is an HMAC over the exact bytes sent, which
  // parsing throws away — keep them for that one route. This callback must
  // never throw: an exception here would 400 every request on the server.
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.startsWith("/sprintboardapi/github/webhook")) {
      req.rawBody = buf;
    }
  },
}));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the sprintboard backend." });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Raw OpenAPI spec as JSON — useful for importing into Postman/Insomnia,
// the offline Swagger Editor, or just saving a snapshot to disk.
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

require("./app/routes/auth.routes.js")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/sprint.routes.js")(app);
require("./app/routes/project.routes.js")(app);
require("./app/routes/boardStatus.routes.js")(app);
require("./app/routes/test.routes.js")(app);
require("./app/routes/ticket.routes.js")(app);
require("./app/routes/retrospective.routes.js")(app);
require("./app/routes/retrospectiveItems.routes.js")(app);
require("./app/routes/userActivityLog.routes.js")(app);
require("./app/routes/testHistory.routes.js")(app);
require("./app/routes/githubRepositories.routes.js")(app);
require("./app/routes/githubWebhook.routes.js")(app);
require("./app/routes/comment.routes.js")(app);


// set port, listen for requests
const PORT = process.env.PORT || 3200;
startServer();

module.exports = app;