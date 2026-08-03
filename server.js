require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const db = require("./app/models");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");

const startServer = async () => {
  try {
    await db.sequelize.sync({ alter: false }); // update this to false or true when you update anything in models
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
  origin: "http://localhost:8081",
};

app.use(cors(corsOptions));
app.options("*", cors());

// parse requests of content-type - application/json
app.use(express.json());

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

// set port, listen for requests
const PORT = process.env.PORT || 3200;
startServer();

module.exports = app;