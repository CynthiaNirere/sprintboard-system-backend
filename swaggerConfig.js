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
        RepoUpdateInput: {
          type: "object",
          description:
            "Any subset of Repo fields to change. PUT passes the body straight to Sequelize with no validation, so nothing is required. owner and repoSlug are re-derived from url and cannot be set directly.",
          properties: {
            url: { type: "string", example: "https://github.com/acme/widgets" },
            name: { type: "string" },
            projectId: { type: "integer" },
            developmentBranch: { type: "string" },
            webhookSecret: {
              type: "string",
              format: "password",
              nullable: true,
              writeOnly: true,
              description:
                "Send a new secret to replace the stored one, or null to clear it. Omit the field to leave it untouched. An empty string is rejected with 400.",
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
              description:
                "Included on GET /projects, GET /projects/{id}, GET /projects/user/{userId}, and GET /users/{id}. GET /projects/{id} returns only id/name/isActive; GET /users/{id} returns the full sprint record (see the Sprint schema).",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  isActive: { type: "boolean" },
                  startDate: { type: "string", format: "date" },
                  endDate: { type: "string", format: "date" },
                },
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
            users: {
              type: "array",
              description:
                "Only included on GET /projects/user/{userId}, where it contains just the user being queried. The membership role arrives nested under the project_member join-table key.",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  project_member: {
                    type: "object",
                    properties: {
                      projectRole: { type: "string", enum: ["PROJECT_ADMIN", "DEVELOPER"] },
                    },
                  },
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
          description:
            "A user as returned by GET /projects/{id}/members. The membership role is NOT a top-level field — Sequelize nests the join-table columns under the `project_member` key.",
          properties: {
            id: { type: "integer", example: 3 },
            firstName: { type: "string", example: "Sofia" },
            lastName: { type: "string", example: "Chen" },
            globalRole: { type: "string", enum: ["ADMIN", "USER"] },
            project_member: {
              type: "object",
              description: "The project_members join-table row for this user on this project.",
              properties: {
                projectRole: { type: "string", enum: ["PROJECT_ADMIN", "DEVELOPER"] },
              },
            },
          },
        },
        ProjectMemberRow: {
          type: "object",
          description: "The raw project_members join-table row, as returned by POST /projects/{projectId}/members.",
          properties: {
            id: { type: "integer", example: 12 },
            projectId: { type: "integer" },
            userId: { type: "integer" },
            projectRole: { type: "string", enum: ["PROJECT_ADMIN", "DEVELOPER"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ProjectUpdateInput: {
          type: "object",
          description:
            "Any subset of Project fields to change. PUT /projects/{id} passes the body straight to Sequelize with no validation, so nothing is required.",
          properties: {
            name: { type: "string" },
            description: { type: "string", nullable: true },
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
                "Defaults to true when omitted. The controller supplies this default explicitly; the Sprint model's own column default is false.",
            },
          },
        },
        SprintUpdateInput: {
          type: "object",
          description:
            "Any subset of Sprint fields to change. PUT passes the body straight to Sequelize with no validation, so nothing is required. Changing startDate/endDate still runs the overlapping-sprint check, which returns 400.",
          properties: {
            name: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            projectId: { type: "integer" },
            isActive: { type: "boolean" },
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
            githubEvent: {
              type: "string",
              example: "create_branch",
              default: "none",
              description:
                "The GitHub automation that fires when a ticket is moved into this column. Use \"none\" for a column that triggers nothing.",
            },
          },
        },
        BoardStatusInput: {
          type: "object",
          required: ["name", "columnOrder", "projectId", "githubEvent"],
          properties: {
            name: { type: "string" },
            columnOrder: { type: "integer" },
            projectId: { type: "integer" },
            githubEvent: {
              type: "string",
              example: "none",
              description:
                "Required — the controller rejects a missing githubEvent with 400. Send \"none\" for a column with no GitHub automation.",
            },
          },
        },
        BoardStatusUpdateInput: {
          type: "object",
          description:
            "Any subset of BoardStatus fields to change. PUT passes the body straight to Sequelize with no validation, so nothing is required here — unlike POST, which does require githubEvent.",
          properties: {
            name: { type: "string" },
            columnOrder: { type: "integer" },
            projectId: { type: "integer" },
            githubEvent: { type: "string" },
          },
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
            repoId: {
              type: "integer",
              nullable: true,
              description:
                "The linked repository the GitHub automation acts on. Leave it null when the project has exactly one repository — the automation resolves it automatically and reports AMBIGUOUS_REPO if there is more than one.",
            },
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
          required: ["title", "type", "priority"],
          description:
            "Only title is validated with a clean 400 error if missing. type and priority are NOT NULL in the database and raise a raw 500 (not a clean 400) if omitted. statusId is optional — it is nullable and defaults to null, leaving the ticket off the board until it is assigned a column.",
          properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            type: { type: "string", enum: ["FEATURE", "ENHANCEMENT", "BUG"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            statusId: { type: "integer", nullable: true },
            projectId: { type: "integer", nullable: true },
            sprintId: { type: "integer", nullable: true },
            assigneeId: { type: "integer", nullable: true },
            repoId: { type: "integer", nullable: true, description: "The linked repository the GitHub automation acts on." },
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
            repoId: { type: "integer", nullable: true, description: "The linked repository the GitHub automation acts on." },
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
            findings: {
              type: "string",
              nullable: true,
              description: "Free-text notes recorded when the test is run — typically what failed and why.",
            },
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
            findings: { type: "string", nullable: true, description: "Free-text notes about the test run." },
            userId: { type: "integer", nullable: true, description: "Maps to the test's ownerId column." },
          },
        },
        TestUpdateInput: {
          type: "object",
          description:
            "Any subset of Test fields to change. PUT passes the body straight to Sequelize with no validation, so nothing is required — this is the route used to flip status and record findings.",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            ticketId: { type: "integer" },
            status: { type: "string", enum: ["PENDING", "FAILED", "PASSED"] },
            findings: { type: "string", nullable: true },
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
        RetroUpdateInput: {
          type: "object",
          description:
            "Any subset of Retro fields to change. PUT passes the body straight to Sequelize with no validation, so nothing is required.",
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
        RetroItemUpdateInput: {
          type: "object",
          description:
            "Any subset of RetroItem fields to change. PUT passes the body straight to Sequelize with no validation, so nothing is required.",
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
            ticketId: { type: "integer" },
            testId: {
              type: "integer",
              nullable: true,
              description: "Always null on comments created through this API — no endpoint currently sets it.",
            },
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

        TicketHistory: {
          type: "object",
          description:
            "One recorded change to a ticket. Written automatically on ticket create and on every ticket update — there is no endpoint for creating these by hand.",
          properties: {
            id: { type: "integer", example: 41 },
            field: {
              type: "string",
              nullable: true,
              example: "statusId",
              description: "Which ticket attribute changed. Null marks the 'ticket created' row.",
              enum: [
                "title",
                "description",
                "type",
                "priority",
                "storyPoints",
                "githubBranchName",
                "githubBranchCreatedAt",
                "githubPrURL",
                "assigneeId",
                "projectId",
                "sprintId",
                "statusId",
                "repoId",
              ],
            },
            oldValue: { type: "string", nullable: true, example: "2", description: "The raw previous value." },
            oldLabel: {
              type: "string",
              nullable: true,
              example: "In Progress",
              description:
                "The previous value in human-readable form. Identical to oldValue except for the foreign-key fields (assigneeId resolves to an email, sprintId/statusId/repoId to a name), where it is resolved for display. A sprintId of null resolves to \"backlog\".",
            },
            newValue: { type: "string", nullable: true, example: "3" },
            newLabel: { type: "string", nullable: true, example: "In Review" },
            message: {
              type: "string",
              example: "Ticket statusId changed by: priya.shah@sprintly.dev",
              description: 'Either "Ticket created by: <email>" or "Ticket <field> changed by: <email>".',
            },
            userId: {
              type: "integer",
              nullable: true,
              description: "Who made the change. Null for changes made by the server itself, such as a GitHub webhook delivery.",
            },
            ticketId: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        TestHistory: {
          type: "object",
          description: "One recorded event against a test.",
          properties: {
            id: { type: "integer", example: 7 },
            message: { type: "string", example: "Marked PASSED after re-running the seed script." },
            userId: { type: "integer" },
            testId: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        TestHistoryInput: {
          type: "object",
          required: ["message", "userId"],
          description:
            "Both fields are required by the database but neither is validated by the controller — omitting one returns 500, not 400. userId is taken from the body, not from the authenticated session, so it is not checked against the caller.",
          properties: {
            message: { type: "string", example: "Marked PASSED after re-running the seed script." },
            userId: { type: "integer", description: "The user this history entry is attributed to." },
          },
        },

        UserActivityLog: {
          type: "object",
          description:
            "One audit-log entry. Written automatically by the controllers that perform the action — there is no endpoint for creating these by hand.",
          properties: {
            id: { type: "integer", example: 128 },
            action: {
              type: "string",
              example: "Ticket created",
              enum: [
                "Login",
                "Logout",
                "User created",
                "Global role changed",
                "Project role changed",
                "Project created",
                "Project deleted",
                "Member added",
                "Member removed",
                "Ticket created",
                "Ticket updated",
                "Ticket deleted",
                "Sprint created",
                "Sprint updated",
                "Sprint deleted",
                "GitHub repo linked",
                "GitHub branch created",
                "GitHub PR created",
                "GitHub PR opened",
                "GitHub PR merged",
                "GitHub token updated",
                "GitHub token cleared",
                "Board status updated",
                "Test status changed",
                "Attachment uploaded",
                "Attachment deleted",
                "Retro created",
                "Retro item added",
              ],
            },
            detail: {
              type: "string",
              example: ' created ticket "Refactor database seed script"',
              description:
                "A sentence fragment meant to be appended to the acting user's name, so it begins with a leading space.",
            },
            ipAddress: { type: "string", nullable: true, example: "203.0.113.7" },
            userAgent: { type: "string", nullable: true },
            userId: { type: "integer", nullable: true },
            createdAt: { type: "string", format: "date-time" },
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