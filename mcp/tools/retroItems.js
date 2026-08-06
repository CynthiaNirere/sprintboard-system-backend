import { z } from "zod";
const retroItemController = require("../../app/controllers/retrospective.items.controller.js");
const { callController } = require("../lib/call-controller.js");

export function registerRetroItemTools(server) {
  // --- AC1: Retrieve Project Data ---

  server.addTool({
    name: "get_retro_items",
    description: "Get all items belonging to a retrospective.",
    parameters: z.object({ retroId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(retroItemController.findRetroItem, {
          params: { retroId: args.retroId },
        })
      ),
  });

  server.addTool({
    name: "get_retro_item",
    description: "Get a single retrospective item by id.",
    parameters: z.object({ retroItemId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(retroItemController.findOne, { params: { id: args.retroItemId } })
      ),
  });

  // --- AC2: Execute Supported Actions ---

  server.addTool({
    name: "create_retro_item",
    description: "Add an item (e.g. what went well, what to improve) to a retrospective.",
    parameters: z.object({
      itemType: z.string(),
      content: z.string(),
      retroId: z.number(),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      // userId always comes from the authenticated session, never a
      // caller-supplied argument — the real controller reads userId
      // straight from the request body, which would otherwise let the
      // assistant attribute an item to any arbitrary user.
      return JSON.stringify(
        await callController(retroItemController.create, {
          body: { ...args, userId: context.session.userId },
        })
      );
    },
  });

  server.addTool({
    name: "update_retro_item",
    description: "Update a retrospective item's fields.",
    parameters: z.object({
      retroItemId: z.number(),
      updates: z.record(z.any()).describe("Fields to update, e.g. { itemType, content }"),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(retroItemController.update, {
          params: { id: args.retroItemId },
          body: args.updates,
        })
      );
    },
  });

  server.addTool({
    name: "delete_retro_item",
    description: "Delete a retrospective item by id.",
    parameters: z.object({ retroItemId: z.number() }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(retroItemController.delete, { params: { id: args.retroItemId } })
      );
    },
  });

  // findAll and deleteAll omitted — see the note in the response about
  // findAll's title filter being effectively unscoped. findRetroItem is
  // the properly-scoped read instead.
}