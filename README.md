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