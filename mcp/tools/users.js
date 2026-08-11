import { z } from "zod";
const userController = require("../../app/controllers/user.controller.js");
const { callController } = require("../lib/call-controller.js");
const { isGlobalAdmin } = require("../lib/permissions.js");

export function registerUserTools(server) {
  // --- AC1: Retrieve Project Data ---

  server.addTool({
    name: "get_all_users",
    description: "Get every user in the workspace, with their id, name, email, and global role.",
    parameters: z.object({}),
    execute: async () =>
      JSON.stringify(await callController(userController.findAll, {})),
  });

  server.addTool({
    name: "get_user",
    description: "Get a single user by id, including the projects they belong to.",
    parameters: z.object({ userId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(userController.findOne, { params: { id: args.userId } })
      ),
  });

  // --- AC2: Execute Supported Actions ---

  server.addTool({
    name: "update_user_global_role",
    description: "Change a user's global role between ADMIN and USER. Admin only.",
    parameters: z.object({
      userId: z.number(),
      globalRole: z.enum(["ADMIN", "USER"]),
    }),
    execute: async (args, context) => {
      if (!(await isGlobalAdmin(context.session?.userId))) {
        throw new Response("Admin privileges required", { status: 403 });
      }
      return JSON.stringify(
        await callController(userController.update, {
          params: { id: args.userId },
          body: { globalRole: args.globalRole },
        })
      );
    },
  });

  // create_user is deliberately NOT included yet — see the response for why.
}