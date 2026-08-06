import { z } from "zod";
const ticketController = require("../../app/controllers/ticket.controller.js");
const { callController } = require("../lib/call-controller.js");

export function registerTicketTools(server) {
  //  Retrieve ticket Data 

  server.addTool({
    name: "get_ticket",
    description: "Get a single ticket by id, including its tests.",
    parameters: z.object({ ticketId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(ticketController.findOne, { params: { id: args.ticketId } })
      ),
  });

  server.addTool({
    name: "get_tickets_for_project",
    description: "Get all tickets belonging to a project.",
    parameters: z.object({ projectId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(ticketController.findTicketsForAProject, {
          params: { id: args.projectId },
        })
      ),
  });

  server.addTool({
    name: "get_tickets_for_sprint",
    description: "Get all tickets in a sprint, ordered by priority.",
    parameters: z.object({ sprintId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(ticketController.findBySprint, {
          params: { sprintId: args.sprintId },
        })
      ),
  });

  server.addTool({
    name: "get_backlog",
    description: "Get all tickets for a project that aren't assigned to any sprint.",
    parameters: z.object({ projectId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(ticketController.findBacklog, {
          query: { projectId: args.projectId },
        })
      ),
  });

  server.addTool({
    name: "create_ticket",
    description: "Create a new ticket.",
    parameters: z.object({
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["FEATURE", "ENHANCEMENT", "BUG"]),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
      storyPoints: z.number().optional(),
      projectId: z.number(),
      sprintId: z.number().optional(),
      statusId: z.number(),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(await callController(ticketController.create, { body: args }));
    },
  });

  server.addTool({
    name: "update_ticket",
    description: "Update a ticket's fields.",
    parameters: z.object({
      ticketId: z.number(),
      updates: z.record(z.any()).describe("Fields to update, e.g. { title, description, priority }"),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(ticketController.update, {
          params: { id: args.ticketId },
          body: args.updates,
        })
      );
    },
  });

  server.addTool({
    name: "delete_ticket",
    description: "Delete a ticket by id.",
    parameters: z.object({ ticketId: z.number() }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(ticketController.delete, { params: { id: args.ticketId } })
      );
    },
  });

  server.addTool({
    name: "move_ticket_to_sprint",
    description: "Move a ticket into a specific sprint.",
    parameters: z.object({
      ticketId: z.number(),
      sprintId: z.number(),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(ticketController.assignToSprint, {
          params: { id: args.ticketId },
          body: { sprintId: args.sprintId },
        })
      );
    },
  });

  server.addTool({
    name: "remove_ticket_from_sprint",
    description: "Send a ticket back to the backlog (clears its sprint).",
    parameters: z.object({ ticketId: z.number() }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(ticketController.removeFromSprint, {
          params: { id: args.ticketId },
        })
      );
    },
  });
}