import { z } from "zod";
const projectController = require("../../app/controllers/project.controller.js");
const db = require("../../app/models");
const { callController } = require("../lib/call-controller.js");

async function isProjectAdminOrGlobalAdmin(userId, projectId) {
  const user = await db.user.findByPk(userId);
  if (user?.globalRole === "ADMIN") return true;

  const membership = await db.projectMember.findOne({
    where: { userId, projectId },
  });
  return membership?.projectRole === "PROJECT_ADMIN";
}

async function isGlobalAdmin(userId) {
  const user = await db.user.findByPk(userId);
  return user?.globalRole === "ADMIN";
}

export function registerProjectTools(server) {
  // --- AC1: Retrieve Project Data ---

  server.addTool({
    name: "get_my_projects",
    description: "Get all projects the current authenticated user belongs to, with their role on each.",
    parameters: z.object({}), // always scoped to the session's own userId, never a param
    execute: async (args, context) =>
      JSON.stringify(
        await callController(projectController.findUserProjects, {
          params: { userId: context.session.userId },
        })
      ),
  });

  server.addTool({
    name: "get_project",
    description: "Get a single project by id, including its board statuses, repositories, and sprints.",
    parameters: z.object({ projectId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(projectController.findOne, { params: { id: args.projectId } })
      ),
  });

  server.addTool({
    name: "get_project_members",
    description: "Get all members of a project and their roles.",
    parameters: z.object({ projectId: z.number() }),
    execute: async (args) =>
      JSON.stringify(
        await callController(projectController.findProjectMembers, {
          params: { id: args.projectId },
        })
      ),
  });

  // --- AC2: Execute Supported Actions ---

  server.addTool({
    name: "create_project",
    description: "Create a new project. The requesting user becomes its creator.",
    parameters: z.object({
      name: z.string(),
      description: z.string().optional(),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(projectController.create, {
          body: args,
          userId: context.session.userId,
        })
      );
    },
  });

  server.addTool({
    name: "add_project_member",
    description: "Add a user to a project with a given role.",
    parameters: z.object({
      projectId: z.number(),
      userId: z.number(),
      projectRole: z.enum(["PROJECT_ADMIN", "DEVELOPER"]),
    }),
    execute: async (args, context) => {
      const allowed = await isProjectAdminOrGlobalAdmin(context.session?.userId, args.projectId);
      if (!allowed) {
        throw new Response("Not authorized to add members to this project", { status: 403 });
      }
      return JSON.stringify(
        await callController(projectController.addProjectMember, {
          params: { id: args.projectId },
          body: { userId: args.userId, projectRole: args.projectRole },
        })
      );
    },
  });

  server.addTool({
    name: "update_project_member_role",
    description: "Update a project member's role. The controller enforces its own rules on top of this.",
    parameters: z.object({
      projectId: z.number(),
      userId: z.number(),
      projectRole: z.enum(["PROJECT_ADMIN", "DEVELOPER"]),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(projectController.updateProjectMember, {
          params: { id: args.projectId },
          body: { userId: args.userId, projectRole: args.projectRole },
          userId: context.session.userId, 
        })
      );
    },
  });

  server.addTool({
    name: "remove_project_member",
    description: "Remove a user from a project. The controller enforces its own rules on top of this.",
    parameters: z.object({
      projectId: z.number(),
      userId: z.number(),
    }),
    execute: async (args, context) => {
      if (!context.session?.userId) {
        throw new Response("Not authorized", { status: 403 });
      }
      return JSON.stringify(
        await callController(projectController.deleteProjectMember, {
          params: { id: args.projectId, userId: args.userId },
          userId: context.session.userId,
        })
      );
    },
  });

  server.addTool({
    name: "update_project",
    description: "Update a project's name or description. Admin only.",
    parameters: z.object({
      projectId: z.number(),
      updates: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
      }),
    }),
    execute: async (args, context) => {
      if (!(await isGlobalAdmin(context.session?.userId))) {
        throw new Response("Admin privileges required", { status: 403 });
      }
      return JSON.stringify(
        await callController(projectController.update, {
          params: { id: args.projectId },
          body: args.updates,
        })
      );
    },
  });

  server.addTool({
    name: "delete_project",
    description: "Delete a project by id. Admin only.",
    parameters: z.object({ projectId: z.number() }),
    execute: async (args, context) => {
      if (!(await isGlobalAdmin(context.session?.userId))) {
        throw new Response("Admin privileges required", { status: 403 });
      }
      return JSON.stringify(
        await callController(projectController.delete, { params: { id: args.projectId } })
      );
    },
  });
}