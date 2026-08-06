import "dotenv/config"; 
 
import { FastMCP } from "fastmcp";
import { authenticate } from "./auth.js";
import { registerTicketTools } from "./tools/tickets.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerSprintTools } from "./tools/sprints.js";
import { registerRetrospectiveTools } from "./tools/retrospectives.js";
import { registerRetroItemTools } from "./tools/retroItems.js";
// import { registerUserTools } from "./tools/users.js";
 
const server = new FastMCP({
  name: "SprintBoard MCP Server",
  version: "1.0.0",
  authenticate,
});
 
registerTicketTools(server);
registerProjectTools(server);
registerSprintTools(server);
registerRetrospectiveTools(server);
registerRetroItemTools(server);
// registerUserTools(server);
 
server.start({
  transportType: "httpStream",
  httpStream: {
    port: 3201, // separate from your existing backend's port (3200)
  },
});
 