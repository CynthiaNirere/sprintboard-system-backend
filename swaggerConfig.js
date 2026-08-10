const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SprintBoard API",
      version: "1.0.0",
      description:
        "REST API for SprintBoard, the internal Agile project management tool (projects, sprints, board statuses, tickets, tests, and users).",
    },
    servers: [
      {
        url: "http://localhost:3200/sprintboardapi",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "Send the token returned by POST /login or POST /users (registration) as `Authorization: Bearer <token>` on every subsequent request. This is an AES-256-GCM encrypted session id, not a JWT.",
        },
        basicAuth: {
          type: "http",
          scheme: "basic",
          description:
            'Used only by POST /login. Send `Authorization: Basic base64(email:password)`. This endpoint does NOT accept email/password as a JSON body.',
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { message: { type: "string", example: "Some error occurred." } },
        },
        Message: {
          type: "object",
          properties: { message: { type: "string", example: "Operation completed successfully." } },
        },

        LoginResponse: {
          type: "object",
          description: "Returned by both POST /login and POST /users (registration auto-logs the user in).",
          properties: {
            id: { type: "integer", example: 3 },
            username: { type: "string", nullable: true, example: "pshah" },
            firstName: { type: "string", example: "Priya" },
            lastName: { type: "string", example: "Shah" },
            email: { type: "string", example: "priya.shah@sprintly.dev" },
            githubAccount: { type: "string", nullable: true, example: "priya-shah-ocu" },
            globalRole: { type: "string", enum: ["ADMIN", "USER"], example: "ADMIN" },
            token: { type: "string", description: "Bearer token — use as Authorization: Bearer <token> on subsequent requests." },
            sessionExpireDate: { type: "string", format: "date-time" },
          },
        },

        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 3 },
            username: { type: "string", nullable: true },
            firstName: { type: "string", example: "Priya" },
            lastName: { type: "string", example: "Shah" },
            email: { type: "string", example: "priya.shah@sprintly.dev" },
            githubAccount: { type: "string", nullable: true },
            globalRole: { type: "string", enum: ["ADMIN", "USER"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            projects: {
              type: "array",
              description: "Only included on GET /users/{id} — this user's projects, each with its sprints nested.",
              items: { $ref: "#/components/schemas/Project" },
            },
          },
        },
        UserInput: {
          type: "object",
          required: ["firstName", "lastName", "username", "email", "password"],
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
            githubAccount: {
              type: "string",
              nullable: true,
              description: "Overwritten by the verified login when a githubToken is supplied.",
            },
            githubToken: {
              type: "string",
              format: "password",
              nullable: true,
              writeOnly: true,
              description:
                "Optional. A GitHub personal access token — prefer a fine-grained token scoped to the single repository with 'Contents: Read and write', since a classic 'repo' token grants access to every repository the user can see. When supplied it is verified against GitHub, stored AES-256-GCM encrypted, and never returned by any endpoint.",
              example: "github_pat_11ABCDEFG0abcdefghijkl_...",
            },
          },
        },
        UserUpdateInput: {
          type: "object",
          description: "Only these fields are updatable via PUT /users/{id}. Password cannot be changed on this route.",
          properties: {
            username: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            githubAccount: {
              type: "string",
              nullable: true,
              description: "Overwritten by the verified login when a githubToken is supplied.",
            },
            globalRole: { type: "string", enum: ["ADMIN", "USER"] },
            githubToken: {
              type: "string",
              format: "password",
              nullable: true,
              writeOnly: true,
              description:
                "Send a token to connect or replace the GitHub account — it is verified against GitHub before being stored encrypted. Send null to clear the stored token. Omit the field to leave it untouched.",
              example: "github_pat_11ABCDEFG0abcdefghijkl_...",
            },
          },
        },

        Repo: {
          type: "object",
          properties: {
            id: { type: "integer", example: 3 },
            projectId: { type: "integer" },
            url: { type: "string", example: "https://github.com/acme/widgets" },
            name: {
              type: "string",
              example: "Widgets API",
              description: "A display label chosen by whoever linked the repository. Free text.",
            },
            owner: {
              type: "string",
              nullable: true,
              example: "acme",
              readOnly: true,
              description: "The GitHub account or organisation. Derived from url. Null when the url cannot be parsed.",
            },
            repoSlug: {
              type: "string",
              nullable: true,
              example: "widgets",
              readOnly: true,
              description:
                "The GitHub repository slug. Derived from url. Webhook deliveries are matched on owner + repoSlug, so this is what identifies the repository to GitHub — not name.",
            },
            developmentBranch: { type: "string", example: "dev" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        RepoInput: {
          type: "object",
          required: ["url", "name", "projectId", "developmentBranch"],
          properties: {
            url: { type: "string", example: "https://github.com/acme/widgets" },
            name: {
              type: "string",
              example: "Widgets API",
              description: "A display label for this repository. Free text, and freely renamable.",
            },
            projectId: { type: "integer" },
            developmentBranch: {
              type: "string",
              description: "The branch new ticket branches are cut from. Must exist on GitHub.",
            },
            webhookSecret: {
              type: "string",
              format: "password",
              nullable: true,
              writeOnly: true,
              description:
                "Optional. The secret configured on this repository's GitHub webhook, used to verify delivery signatures. Stored encrypted and never returned by any endpoint — if it is lost, send a new one and update GitHub to match. Send null to clear it, which disables the webhook for this repository.",
            },
          },
        },
        GithubWebhookPayload: {
          type: "object",
          description: "The subset of GitHub's pull_request payload this endpoint reads.",
          properties: {
            action: {
              type: "string",
              example: "opened",
              description: "opened and reopened map to pr_opened; closed with merged=true maps to pr_merged. Everything else is ignored.",
            },
            repository: {
              type: "object",
              properties: {
                full_name: { type: "string", example: "acme/widgets" },
              },
            },
            pull_request: {
              type: "object",
              properties: {
                number: { type: "integer", example: 42 },
                merged: { type: "boolean" },
                html_url: { type: "string", example: "https://github.com/acme/widgets/pull/42" },
                head: {
                  type: "object",
                  properties: {
                    ref: { type: "string", example: "bugfix/users-cannot-login" },
                  },
                },
              },
            },
          },
        },
        GithubTokenStatus: {
          type: "object",
          description: "Whether a user has a GitHub token on file. The token itself is never returned.",
          properties: {
            connected: { type: "boolean", example: true },
            updatedAt: { type: "string", format: "date-time", nullable: true },
            githubAccount: { type: "string", nullable: true, example: "justin-walraven" },
          },
        },
        GithubAutomationResult: {
          type: "object",
          description:
            "Present on PUT /ticket/{id} only when the update moved the ticket into a board status carrying a GitHub event. The ticket move itself always succeeds — check `ok` to see whether the GitHub side worked.",
          properties: {
            ran: { type: "boolean", example: true },
            ok: { type: "boolean", example: true },
            branch: {
              type: "string",
              example: "bugfix/users-cannot-login",
              description: "Present for a create_branch column.",
            },
            pullRequestUrl: {
              type: "string",
              example: "https://github.com/acme/widgets/pull/7",
              description: "Present for a create_pr column.",
            },
            pullRequestNumber: { type: "integer", example: 7 },
            alreadyExisted: {
              type: "boolean",
              description:
                "True when the branch or pull request was already present on GitHub, or already recorded on the ticket.",
            },
            repoId: { type: "integer", nullable: true },
            reason: {
              type: "string",
              description: "Why nothing was attempted.",
              enum: [
                "NO_EVENT",
                "TICKET_NOT_FOUND",
                "NO_REPO_LINKED",
                "AMBIGUOUS_REPO",
                "REPO_PROJECT_MISMATCH",
                "REPO_URL_UNPARSEABLE",
                "NO_TOKEN",
                "TOKEN_UNREADABLE",
                "NO_BRANCH",
              ],
            },
            code: {
              type: "string",
              description: "Why the GitHub call failed.",
              enum: [
                "BAD_TOKEN",
                "FORBIDDEN",
                "RATE_LIMITED",
                "NOT_FOUND",
                "BASE_BRANCH_NOT_FOUND",
                "INVALID_BRANCH_NAME",
                "NO_COMMITS",
                "INVALID",
                "TIMEOUT",
                "NETWORK",
                "UNKNOWN",
              ],
            },
            message: { type: "string" },
          },
        },

        Project: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Test Project" },
            description: { type: "string", nullable: true },
            createdBy: { type: "integer", description: "Set automatically from the authenticated user's id — not client-supplied." },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            projectSprints: {
              type: "array",
              description: "Included on GET /projects, GET /projects/{id}, GET /projects/user/{userId}, and GET /users/{id}.",
              items: {
                type: "object",
                properties: { id: { type: "integer" }, name: { type: "string" }, isActive: { type: "boolean" } },
              },
            },
            projectTickets: {
              type: "array",
              description: "Included on GET /projects and GET /projects/user/{userId} (ids only).",
              items: { type: "object", properties: { id: { type: "integer" } } },
            },
            projectBoardStatuses: {
              type: "array",
              description: "Included on GET /projects, GET /projects/{id}, and GET /projects/user/{userId}.",
              items: {
                type: "object",
                properties: { name: { type: "string" }, columnOrder: { type: "integer" } },
              },
            },
            projectRepositories: {
              type: "array",
              description: "Included on GET /projects, GET /projects/{id} (id/name only), and GET /projects/user/{userId}.",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  url: { type: "string", description: "Only included on GET /projects and GET /projects/user/{userId}, not GET /projects/{id}." },
                },
              },
            },
          },
        },
        ProjectInput: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string" }, description: { type: "string", nullable: true } },
        },

        ProjectMember: {
          type: "object",
          properties: {
            id: { type: "integer", example: 3 },
            firstName: { type: "string", example: "Sofia" },
            lastName: { type: "string", example: "Chen" },
            globalRole: { type: "string", enum: ["ADMIN", "USER"] },
            projectRole: { type: "string", enum: ["PROJECT_ADMIN", "DEVELOPER"], description: "Comes from the project_members join table, not the user record itself." },
          },
        },
        ProjectMemberInput: {
          type: "object",
          required: ["userId", "projectRole"],
          description:
            "Both fields are validated by addProjectMember and updateProjectMember. addProjectMember also rejects a userId already on the project (400, \"This user is already a member of this project.\"). updateProjectMember and the delete endpoint restrict changes to existing Project Admins to true Admins only.",
          properties: {
            userId: { type: "integer" },
            projectRole: { type: "string", enum: ["PROJECT_ADMIN", "DEVELOPER"] },
          },
        },

        Sprint: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            projectId: { type: "integer" },
            name: { type: "string", example: "Sprint 1: Core Infrastructure" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            sprintRetrospective: {
              type: "object",
              nullable: true,
              description: "Included on GET /sprints and GET /sprints/{id}. Null if no retrospective has been created for this sprint yet.",
              properties: {
                id: { type: "integer" },
                title: { type: "string" },
                status: { type: "string", enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
                completionDate: { type: "string", format: "date-time", nullable: true },
                retrospectiveItems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      itemType: { type: "string", enum: ["WHAT_WENT_WELL", "WHAT_DID_NOT_GO_WELL", "NEEDS_IMPROVEMENT"] },
                      content: { type: "string" },
                      user: {
                        type: "object",
                        properties: { id: { type: "integer" }, email: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        SprintInput: {
          type: "object",
          required: ["name", "startDate", "endDate", "projectId"],
          properties: {
            name: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            projectId: { type: "integer" },
            isActive: {
              type: "boolean",
              default: true,
              description:
                "Defaults to true if omitted (note: this differs from the Sprint model's own column default of false — confirm this is intentional).",
            },
          },
        },
        RecurringSprintInput: {
          type: "object",
          description:
            'Generates "count" sequential sprints, each "lengthDays" long, named "{name} 1", "{name} 2", etc. All are created with isActive = true.',
          required: ["name", "startDate", "lengthDays", "count", "projectId"],
          properties: {
            name: { type: "string", example: "Sprint", description: 'Base name — each generated sprint appends " 1", " 2", etc.' },
            startDate: { type: "string", format: "date" },
            lengthDays: { type: "integer", example: 14 },
            count: { type: "integer", example: 6, description: "How many sprints to generate." },
            projectId: { type: "integer" },
          },
        },

        BoardStatus: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            projectId: { type: "integer" },
            name: { type: "string", example: "In Progress" },
            columnOrder: { type: "integer", example: 1 },
          },
        },
        BoardStatusInput: {
          type: "object",
          required: ["name", "columnOrder", "projectId"],
          properties: { name: { type: "string" }, columnOrder: { type: "integer" }, projectId: { type: "integer" } },
        },

        Ticket: {
          type: "object",
          properties: {
            id: { type: "integer", example: 8 },
            projectId: { type: "integer", nullable: true },
            sprintId: { type: "integer", nullable: true },
            statusId: { type: "integer" },
            assigneeId: { type: "integer", nullable: true },
            title: { type: "string", example: "Refactor database seed script" },
            description: { type: "string", nullable: true },
            type: { type: "string", enum: ["FEATURE", "ENHANCEMENT", "BUG"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], nullable: true },
            storyPoints: { type: "integer", nullable: true, enum: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55] },
            githubBranchName: {
              type: "string",
              nullable: true,
              description:
                "The branch name to use. Set it to choose your own; leave it empty and the automation generates one from the ticket type and title. Once githubBranchCreatedAt is set the branch exists and changing this field no longer creates anything.",
            },
            githubBranchCreatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              readOnly: true,
              description: "Set by the automation when the branch is actually created on GitHub.",
            },
            githubPrURL: {
              type: "string",
              nullable: true,
              description: "Set by the GitHub webhook when a pull request for this ticket's branch opens.",
            },
            githubIssueNumber: { type: "integer", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            ticketTests: {
              type: "array",
              description: "Included on GET /ticket/{id}, GET /ticket/project/{id}, and GET /ticket/sprint/{id}.",
              items: { $ref: "#/components/schemas/Test" },
            },
          },
        },
        TicketInput: {
          type: "object",
          required: ["title", "type", "priority", "statusId"],
          description:
            "Only title is validated with a clean 400 error if missing. type, priority, and statusId are required by the database but currently raise a raw 500 error (not a clean 400) if omitted. Note: repoId exists on the Ticket model but is not currently accepted by this endpoint at all.",
          properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            type: { type: "string", enum: ["FEATURE", "ENHANCEMENT", "BUG"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            statusId: { type: "integer" },
            projectId: { type: "integer", nullable: true },
            sprintId: { type: "integer", nullable: true },
            assigneeId: { type: "integer", nullable: true },
            storyPoints: { type: "integer", nullable: true, enum: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55] },
            githubBranchName: {
              type: "string",
              nullable: true,
              description:
                "Optional. The exact branch name to create when this ticket reaches a CREATE_BRANCH board status. Leave it empty to get the generated convention. An illegal git ref name is reported back as INVALID_BRANCH_NAME when the automation runs.",
            },
            githubPrURL: { type: "string", nullable: true },
            githubIssueNumber: { type: "integer", nullable: true },
          },
        },
        TicketUpdateInput: {
          type: "object",
          description: "Any subset of Ticket fields to change.",
          properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            type: { type: "string", enum: ["FEATURE", "ENHANCEMENT", "BUG"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            statusId: { type: "integer" },
            projectId: { type: "integer" },
            sprintId: { type: "integer", nullable: true },
            assigneeId: { type: "integer", nullable: true },
            storyPoints: { type: "integer", nullable: true, enum: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55] },
            githubBranchName: {
              type: "string",
              nullable: true,
              description:
                "Optional. The exact branch name to create when this ticket reaches a CREATE_BRANCH board status. Leave it empty to get the generated convention. An illegal git ref name is reported back as INVALID_BRANCH_NAME when the automation runs.",
            },
            githubPrURL: { type: "string", nullable: true },
            githubIssueNumber: { type: "integer", nullable: true },
          },
        },

        Test: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            ticketId: { type: "integer" },
            ownerId: { type: "integer", nullable: true },
            title: { type: "string", example: "Seed script is idempotent" },
            description: { type: "string" },
            status: { type: "string", enum: ["PENDING", "FAILED", "PASSED"], default: "PENDING" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TestInput: {
          type: "object",
          required: ["title", "description", "ticketId"],
          description:
            "NOTE: to set the test's owner, send a field called userId in the body — the controller reads req.body.userId and stores it as ownerId. Sending ownerId directly will be ignored.",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            ticketId: { type: "integer" },
            status: { type: "string", enum: ["PENDING", "FAILED", "PASSED"], default: "PENDING" },
            userId: { type: "integer", nullable: true, description: "Maps to the test's ownerId column." },
          },
        },

        Retro: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Sprint 1 Retro" },
            status: { type: "string", enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
            sprintId: { type: "integer" },
            completionDate: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            sprint: {
              type: "object",
              description: "Included on GET /retros, GET /retros/{id}, and GET /retros/sprint/{sprintId}.",
              properties: { id: { type: "integer" }, name: { type: "string" } },
            },
            retrospectiveItems: {
              type: "array",
              description: "Included on the same three endpoints as sprint above.",
              items: { $ref: "#/components/schemas/RetroItem" },
            },
          },
        },
        RetroInput: {
          type: "object",
          required: ["title", "status", "sprintId"],
          properties: {
            title: { type: "string" },
            status: { type: "string", enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
            sprintId: { type: "integer" },
            completionDate: { type: "string", format: "date-time", nullable: true },
          },
        },

        RetroItem: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            itemType: { type: "string", enum: ["WHAT_WENT_WELL", "WHAT_DID_NOT_GO_WELL", "NEEDS_IMPROVEMENT"] },
            content: { type: "string" },
            userId: { type: "integer" },
            retroId: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            user: {
              type: "object",
              description: "Included on GET /retroItems, GET /retroItems/{id}, and GET /retroItems/retro/{retroId}.",
              properties: { id: { type: "integer" }, email: { type: "string" } },
            },
          },
        },
        RetroItemInput: {
          type: "object",
          required: ["itemType", "content", "userId", "retroId"],
          properties: {
            itemType: { type: "string", enum: ["WHAT_WENT_WELL", "WHAT_DID_NOT_GO_WELL", "NEEDS_IMPROVEMENT"] },
            content: { type: "string" },
            userId: { type: "integer" },
            retroId: { type: "integer" },
          },
        },

        Comment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            content: { type: "string" },
            userId: { type: "integer" },
            ticketId: { type: "integer", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            user: {
              type: "object",
              description: "Included on GET /comment/ticket/{ticketId}.",
              properties: { firstName: { type: "string" }, lastName: { type: "string" } },
            },
          },
        },
        CommentInput: {
          type: "object",
          required: ["content", "userId", "ticketId"],
          description:
            "Any \"@First Last\" text in content that matches a real user by first/last name triggers an email notification to that user. This has no effect on the response.",
          properties: {
            content: { type: "string", example: "Looks good, @Priya Shah can you take a look?" },
            userId: { type: "integer" },
            ticketId: { type: "integer" },
          },
        },
      },
    },
    // Applied to every operation by default; individual login route overrides
    // this with basicAuth, and public routes override with security: [].
    security: [{ bearerAuth: [] }],
  },
  // Glob path to the route files containing @swagger JSDoc comments.
  // Matches the ./app/routes/ folder structure used by server.js's requires.
  apis: ["./app/routes/*.js"],
};

module.exports = swaggerJsdoc(options);