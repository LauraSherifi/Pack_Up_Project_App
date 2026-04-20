# PackUp Project Setup Guide For Team Members

This guide explains how to download, configure, and run the PackUp project on a teammate's laptop.

Follow the steps in order. Do not skip the database or `.env` setup, because the frontend depends on the backend, and the backend depends on MySQL.

## 1. What The Project Uses

PackUp has three main parts:

- React frontend, running on `http://localhost:3000`
- Express/Node.js backend, running on `http://localhost:5000`
- MySQL database, usually named `packup_db`

The project also includes optional Docker services:

- RabbitMQ for event messages and Dead Letter Queue
- Redis for caching
- Prometheus for metrics
- Grafana for dashboards

These optional services are helpful for the technical requirements, but the main app can still run locally with only Node.js and MySQL.

## 2. Required Programs

Install these first:

1. Git
2. Node.js LTS
3. MySQL Server
4. MySQL Workbench
5. A code editor, such as Visual Studio Code

Optional:

1. Docker Desktop

Docker is only needed if you want to run MySQL, RabbitMQ, Redis, Prometheus, and Grafana through Docker Compose.

## 3. Download The Project From GitHub

Open Command Prompt, PowerShell, or Git Bash.

Choose a folder where you want to keep the project, for example Desktop:

```bash
cd Desktop
```

Clone the project:

```bash
git clone https://github.com/LauraSherifi/Pack_Up_Project_App.git
```

Open the project folder:

```bash
cd Pack_Up_Project_App
```

## 4. Install Frontend Dependencies

From the main project folder, run:

```bash
npm install
```

This installs the React/frontend dependencies.

If this finishes successfully, stay in the same folder for now.

## 5. Install Backend Dependencies

Go into the backend folder:

```bash
cd server
```

Install backend dependencies:

```bash
npm install
```

After this finishes, go back to the main project folder:

```bash
cd ..
```

## 6. Create The Backend Environment File

The backend needs a private `.env` file.

In the project, there is an example file:

```text
server/.env.example
```

Create a copy of it and name the copy:

```text
server/.env
```

The final file should look like this:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=packup_db
JWT_SECRET=replace_this_with_a_secret_key
PORT=5000
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
```

Important:

- `DB_USER` is usually `root`
- `DB_PASSWORD` must be changed to your own MySQL password
- `DB_NAME` should stay `packup_db`
- `JWT_SECRET` can be any long text, for example `packup_local_secret_123`

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=myPassword123
DB_NAME=packup_db
JWT_SECRET=packup_local_secret_123
PORT=5000
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
```

## 7. Create The Database With The Seed File

The project includes a ready database setup file here:

```text
DATABASE/submission_database.sql
```

This file creates:

- the `packup_db` database
- all required tables
- indexes
- sample users
- sample trips
- sample reviews
- sample logs
- sample notifications

Warning:

This file contains `DROP DATABASE IF EXISTS packup_db;`.

That means if a database named `packup_db` already exists on your laptop, running this file will delete it and recreate it with demo data.

### Import Using MySQL Workbench

1. Open MySQL Workbench.
2. Connect to your local MySQL server.
3. Click `File`.
4. Click `Open SQL Script`.
5. Choose:

```text
Pack_Up_Project_App/DATABASE/submission_database.sql
```

6. Click the lightning/run button.
7. Wait until the script finishes without errors.
8. Refresh schemas on the left side.
9. Confirm that `packup_db` appears.

If `packup_db` appears, the database setup is ready.

## 8. Demo Login Accounts

After importing the seed file, these accounts are available:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@packup.local` | `admin123` |
| Trip Planner | `planner@packup.local` | `planner123` |
| User | `user@packup.local` | `user123` |
| User | `traveler2@packup.local` | `user123` |

Use these accounts to test the different dashboards and roles.

## 9. Start The Backend

Open a terminal in the project folder.

Go to the backend folder:

```bash
cd server
```

Start the backend:

```bash
node index.js
```

If it works, you should see something similar to:

```text
MySQL connected!
Server running on http://localhost:5000
```

Keep this terminal open.

## 10. Start The Frontend

Open a second terminal in the main project folder.

Make sure you are in:

```text
Pack_Up_Project_App
```

Start the frontend:

```bash
npm start
```

The browser should open:

```text
http://localhost:3000
```

If it does not open automatically, open that link manually.

## 11. Quick Test Checklist

After both backend and frontend are running, test these:

1. Open `http://localhost:3000`
2. Log in as admin:
   - `admin@packup.local`
   - `admin123`
3. Check Admin Dashboard.
4. Check System Logs.
5. Log out.
6. Log in as trip planner:
   - `planner@packup.local`
   - `planner123`
7. Check Planner Dashboard.
8. Create or edit a trip.
9. Log out.
10. Log in as user:
    - `user@packup.local`
    - `user123`
11. Open Home page.
12. Search for a trip, for example `Tokyo`.
13. Leave or edit a review.
14. Open Notifications.
15. Check Reviews page.

If these work, the project is running correctly.

## 12. Backend Health Checks

Open these links in the browser while the backend is running:

```text
http://localhost:5000/health
```

Expected result:

```json
{"status":"ok","service":"packup-api"}
```

Check database readiness:

```text
http://localhost:5000/ready
```

Expected result:

```json
{"status":"ready","database":"available"}
```

Check metrics:

```text
http://localhost:5000/metrics
```

Expected result:

Prometheus-style text with values such as:

```text
packup_users_total
packup_trips_total
packup_reviews_total
packup_database_available 1
```

Check API documentation:

```text
http://localhost:5000/api/docs
```

Expected result:

A styled PackUp API Docs page.

## 13. Optional Docker Setup

If Docker Desktop is installed, the project can also run with Docker Compose.

From the main project folder:

```bash
docker compose up --build
```

Docker services:

| Service | URL |
| --- | --- |
| Web app | `http://localhost:3000` |
| Backend API | `http://localhost:5000` |
| RabbitMQ UI | `http://localhost:15672` |
| Prometheus | `http://localhost:9090` |
| Grafana | `http://localhost:3001` |

RabbitMQ Docker login:

```text
username: packup
password: packup_password
```

Grafana Docker login:

```text
username: admin
password: admin
```

If Docker is not installed, skip this section.

## 14. Common Problems And Fixes

### Problem: Backend says database connection failed

Check:

1. MySQL Server is running.
2. `server/.env` exists.
3. `DB_PASSWORD` is correct.
4. `packup_db` exists in MySQL Workbench.
5. The database seed file was imported.

Then restart the backend:

```bash
cd server
node index.js
```

### Problem: Frontend opens but login does not work

Check:

1. Backend is running on `http://localhost:5000`.
2. MySQL is running.
3. Database seed was imported.
4. You are using one of the demo accounts.

### Problem: `npm install` fails

Try:

```bash
npm cache verify
npm install
```

If it still fails, delete `node_modules` and reinstall:

```bash
rm -rf node_modules
npm install
```

On Windows PowerShell, use:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Problem: Frontend says allowedHosts error

Check the file:

```text
.env.development
```

It should include:

```env
HOST=localhost
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

Then restart the frontend:

```bash
npm start
```

### Problem: Port 3000 is already in use

React may ask:

```text
Would you like to run the app on another port instead?
```

Press:

```text
Y
```

Or close the other app using port 3000.

### Problem: Port 5000 is already in use

Close the other backend terminal or process.

Then run again:

```bash
cd server
node index.js
```

### Problem: Notifications do not appear

Check:

1. You are logged in as the correct role.
2. Trip planner creates a trip, then normal users get notifications.
3. User creates or updates a review, then the trip planner gets notifications.
4. The `notifications` table exists in MySQL.

### Problem: RabbitMQ or Redis warnings appear

This is okay if you are not running Docker or local RabbitMQ/Redis.

The app has fallback behavior:

- events are still saved in MySQL
- cache falls back to in-memory storage
- the main app still works

## 15. What Not To Upload Or Edit

Do not upload or commit:

- `node_modules`
- `server/node_modules`
- `server/.env`
- log files
- runtime upload files

These are intentionally ignored by Git.

Use:

```text
server/.env.example
```

as the template for creating your own local:

```text
server/.env
```

## 16. Final Confirmation

The project is fully running when all of these are true:

- frontend opens on `http://localhost:3000`
- backend opens on `http://localhost:5000`
- `/health` returns `status: ok`
- `/ready` returns `database: available`
- login works
- admin dashboard works
- trip planner dashboard works
- user reviews work
- notifications work
- API docs open at `http://localhost:5000/api/docs`

If all of these pass, the project is ready to be shown on that laptop.
