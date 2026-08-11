import { z } from "zod";
const sprintController = require("../../app/controllers/sprint.controller.js");
const { callController } = require("../lib/call-controller.js");

export function registerSprintTools(server) {
  // --- AC1: Retrieve Project Data ---

  server.addTool({
    name: "get_sprints_for_project",
    description: "Get all sprints belonging to a project.",
    // Required, not optional — the controller allows an unfiltered query
    // if projectId is omitted, which would return every sprint system-wide.
    parameters: z.object({ projectId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(sprintController.findAll, {
          query: { projectId: args.projectId },
        })
      ),
  });

  server.addTool({
    name: "get_sprint",
    description: "Get a single sprint by id.",
    parameters: z.object({ sprintId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(sprintController.findOne, { params: { id: args.sprintId } })
      ),
  });

  // --- AC2: Execute Supported Actions ---

  server.addTool({
    name: "create_sprint",
    description: "Create a new sprint for a project.",
    parameters: z.object({
      name: z.string(),
      startDate: z.string().describe("YYYY-MM-DD"),
      endDate: z.string().describe("YYYY-MM-DD"),
      projectId: z.number(),
      isActive: z.boolean().optional(),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(await callController(sprintController.create, { body: args }));
    },
  });

  server.addTool({
    name: "create_recurring_sprints",
    description:
      "Create several equal-length, back-to-back sprints in one call (e.g. eight 2-week sprints).",
    parameters: z.object({
      name: z.string(),
      startDate: z.string().describe("YYYY-MM-DD"),
      lengthDays: z.number(),
      count: z.number(),
      projectId: z.number(),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(sprintController.createRecurring, { body: args })
      );
    },
  });

  server.addTool({
    name: "update_sprint",
    description: "Update a sprint's fields.",
    parameters: z.object({
      sprintId: z.number(),
      updates: z.record(z.any()).describe("Fields to update, e.g. { name, startDate, endDate }"),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(sprintController.update, {
          params: { id: args.sprintId },
          body: args.updates,
        })
      );
    },
  });

  server.addTool({
    name: "delete_sprint",
    description: "Delete a sprint by id.",
    parameters: z.object({ sprintId: z.number() }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(sprintController.delete, { params: { id: args.sprintId } })
      );
    },
  });

  // deleteAll omitted — same reasoning as ticket.controller.js and
  // project.controller.js: wipes every sprint system-wide, no internal
  // permission check to rely on.
}