# SprintBoard Backend with Node

[![codecov](https://codecov.io/github/CynthiaNirere/sprintboard-system-backend/branch/dev/graph/badge.svg?token=4XELFOVZGB)](https://codecov.io/github/CynthiaNirere/sprintboard-system-backend)

This application is an agile project management tool for planning sprints, managing a ticket backlog, and tracking work on a board. Please visit the SprintBoard frontend repository for the Vue 3 frontend.

#### Please note:

- You will need to create a database and be able to run it locally.

## Project Setup

1. Clone the project into your **XAMPP/xamppfiles/htdocs** directory.

```
git clone https://github.com/CynthiaNirere/sprintboard-system-backend.git
```

2. Install the project.

```
npm install
```

3. Configure **Apache** to point to **Node** for API requests.

   - We recommend using XAMPP to serve this project.
   - In XAMPP, find the **Edit/Configure** button for **Apache**.
   - Edit the **conf** file, labeled **httpd.conf**.
   - It may warn you when opening it but open it anyway.
   - Add the following line as the **last line**:

```
   ProxyPass /sprintboardapi http://localhost:3200/sprintboardapi
```

   - Find the following lines and remove the **#** at the front of each line.

```
   LoadModule proxy_http_module modules/mod_proxy_http.so
   LoadModule proxy_http2_module modules/mod_proxy_http2.so
```

   - Save the file.
   - **Restart Apache** and exit XAMPP.

4. Make a local **sprintplanning_db** database.

   - Create a schema/database.
   - Also create **sprintplanning_test_db** for running tests.
   - The Sequelize in this project will make all the tables for you.

5. Add a local **.env** file and make sure that the **database** variables are correct.

   - DB_HOST = 'localhost'
   - DB_PW = '**your-local-database-password**'
   - DB_USER = '**your-local-database-username**' (usually "root")
   - DB_NAME = '**your-local-database-name**' (example: "sprintplanning_db")
   - DB_TEST_NAME = 'sprintplanning_test_db'
   - SECRET_KEY = '**generate your own with the command below**'

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

6. Initialize the database (optional).

   This project includes a seed and verification script at `scripts/init-db.js`.
   It creates sample data and runs a quick CRUD check.

```
npm run init-db
```

   If you want to preserve existing tables and avoid dropping them, run:

```
npm run init-db:keep
```

   To force a full table wipe and recreate everything explicitly:

```
npm run init-db:wipe
```

7. Compile and run the project locally.

```
npm run start
```

   The API runs at http://localhost:3200/sprintboardapi

8. Using docker to deploy

commands: 
   docker compose up -d

9. Running tests and code coverage.

```
npm test
npm run test:coverage
```

   Coverage runs on every push through GitHub Actions and reports to Codecov. To view it locally, open `coverage/lcov-report/index.html`.

## GitHub integration

Board columns drive GitHub, and GitHub moves cards back. Each `board_statuses` row has a
`githubEvent` column:

| `githubEvent` | Direction | Effect |
| --- | --- | --- |
| `none` | — | Nothing (the default) |
| `create_branch` | outbound | Moving a ticket in cuts a branch on the project's linked repo |
| `create_pr` | outbound | Moving a ticket in opens a PR from its branch into `developmentBranch` |
| `pr_opened` | inbound | A ticket moves here when a PR opens on its branch |
| `pr_merged` | inbound | A ticket moves here when that PR is merged |

A `create_pr` column titles the pull request with the ticket title and uses the ticket
description as the body. The ticket must already have a branch — the column will not cut one,
because a branch with no commits cannot be turned into a PR. If the branch has no commits yet,
GitHub rejects it and the response reports `NO_COMMITS`.

### Connecting a GitHub account

Branch creation uses the token of whoever moved the ticket. It is an ordinary user field,
stored encrypted and never returned:

```
POST /sprintboardapi/users        { ..., "githubToken": "github_pat_..." }
PUT  /sprintboardapi/users/:id    { "githubToken": "github_pat_..." }   connect or replace
PUT  /sprintboardapi/users/:id    { "githubToken": null }               disconnect
GET  /sprintboardapi/users/:id/github-token  -> { connected, updatedAt, githubAccount }
```

Prefer a **fine-grained** token scoped to the one repository with **Contents: Read and write** —
a classic `repo` token grants access to every repository that user can see. It is verified
against GitHub before being stored, so a typo is rejected immediately.

### Linking a repository

```
POST /sprintboardapi/repo { url, projectId, developmentBranch, webhookSecret }
```

`name` is your own display label — free text, and renamable at any time with `PUT /repo/:id`.
`owner` and `repoSlug` are derived from `url` and are what incoming webhook deliveries are matched
on, so renaming the label never breaks the integration. `developmentBranch` is what new branches
are cut from and must exist.

### Receiving PR events

Generate a secret — any long random string:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store it on the repository (`webhookSecret` above, or `PUT /repo/:id` to rotate it; `null`
disables the webhook). It is stored encrypted and **never returned** — if it is lost, set a new
one and update GitHub to match.

Then in GitHub: repo → Settings → Webhooks → Add webhook.

- **Payload URL** `https://<host>/sprintboardapi/github/webhook`
- **Content type** `application/json` — required; the signature is checked against the raw body
- **Secret** the same string
- **Events** "Let me select individual events" → **Pull requests** only

Each repository has its own secret, so there is nothing to configure in `.env`. Deliveries that
fail verification get a 401; events with nothing to do get a 2xx so the delivery log stays green.

Locally, GitHub has to be able to reach you — use a tunnel such as smee.io or ngrok and point
the payload URL at that.

### Notes

- Tickets are matched to a PR by `githubBranchName` equalling the PR's head branch, scoped to
  the repository's project. If two tickets in a project share a branch name, the webhook
  declines to guess and moves neither.
- A ticket's `githubBranchName` can be set in advance to choose your own branch name; leave it
  empty for the generated convention.
- `server.js` syncs with `alter: true`, so new columns appear on restart.