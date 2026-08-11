import { z } from "zod";
const retroController = require("../../app/controllers/retrospective.controller.js");
const { callController } = require("../lib/call-controller.js");

export function registerRetrospectiveTools(server) {
  // --- AC1: Retrieve Project Data ---

  server.addTool({
    name: "get_sprint_retro",
    description: "Get the retrospective for a specific sprint, including its items.",
    parameters: z.object({ sprintId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(retroController.findSprintRetro, {
          params: { sprintId: args.sprintId },
        })
      ),
  });

  server.addTool({
    name: "get_retro",
    description: "Get a single retrospective by id.",
    parameters: z.object({ retroId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(retroController.findOne, { params: { id: args.retroId } })
      ),
  });

  // --- AC2: Execute Supported Actions ---

  server.addTool({
    name: "create_retro",
    description: "Create a retrospective for a sprint.",
    parameters: z.object({
      title: z.string(),
      status: z.string(),
      sprintId: z.number(),
      completionDate: z.string().optional().describe("YYYY-MM-DD"),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(await callController(retroController.create, { body: args }));
    },
  });

  server.addTool({
    name: "update_retro",
    description: "Update a retrospective's fields.",
    parameters: z.object({
      retroId: z.number(),
      updates: z.record(z.any()).describe("Fields to update, e.g. { title, status, completionDate }"),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(retroController.update, {
          params: { id: args.retroId },
          body: args.updates,
        })
      );
    },
  });

  server.addTool({
    name: "delete_retro",
    description: "Delete a retrospective by id.",
    parameters: z.object({ retroId: z.number() }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(retroController.delete, { params: { id: args.retroId } })
      );
    },
  });

  // findAll and deleteAll omitted — findAll's title search is unscoped
  // across every retro system-wide; deleteAll wipes everything with no
  // internal permission check. findSprintRetro is the properly-scoped
  // read instead.
}