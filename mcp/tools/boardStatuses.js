import { z } from "zod";
const boardStatusController = require("../../app/controllers/boardStatus.controller.js");
const { callController } = require("../lib/call-controller.js");
const { isGlobalAdmin } = require("../lib/permissions.js");

export function registerBoardStatusTools(server) {
 

  server.addTool({
    name: "get_board_statuses_for_project",
    description:
      "Get all board statuses (columns, e.g. In Progress, Done) for a project, in display order. Use this to find the correct statusId before moving a ticket between statuses.",
    parameters: z.object({ projectId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(boardStatusController.findAllForProject, {
          params: { id: args.projectId },
        })
      ),
  });

  server.addTool({
    name: "get_board_status",
    description: "Get a single board status by id.",
    parameters: z.object({ boardStatusId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(boardStatusController.findOne, {
          params: { id: args.boardStatusId },
        })
      ),
  });


  server.addTool({
    name: "create_board_status",
    description: "Create a new board status (column) for a project. Admin only.",
    parameters: z.object({
      name: z.string(),
      columnOrder: z.number(),
      projectId: z.number(),
    }),
    execute: async (args, context) => {
      if (!(await isGlobalAdmin(context.session?.userId))) {
        throw new Response("Admin privileges required", { status: 403 });
      }
      return JSON.stringify(
        await callController(boardStatusController.create, { body: args })
      );
    },
  });

  server.addTool({
    name: "update_board_status",
    description: "Update a board status's fields. Admin only.",
    parameters: z.object({
      boardStatusId: z.number(),
      updates: z.record(z.any()).describe("Fields to update, e.g. { name, columnOrder }"),
    }),
    execute: async (args, context) => {
      if (!(await isGlobalAdmin(context.session?.userId))) {
        throw new Response("Admin privileges required", { status: 403 });
      }
      return JSON.stringify(
        await callController(boardStatusController.update, {
          params: { id: args.boardStatusId },
          body: args.updates,
        })
      );
    },
  });

  server.addTool({
    name: "delete_board_status",
    description: "Delete a board status by id. Admin only.",
    parameters: z.object({ boardStatusId: z.number() }),
    execute: async (args, context) => {
      if (!(await isGlobalAdmin(context.session?.userId))) {
        throw new Response("Admin privileges required", { status: 403 });
      }
      return JSON.stringify(
        await callController(boardStatusController.delete, {
          params: { id: args.boardStatusId },
        })
      );
    },
  });

}