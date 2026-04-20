# PackUp Runbook

This runbook is a quick operational checklist for running and checking the PackUp project locally.

## 1. Requirements

- Node.js and npm
- MySQL Server
- MySQL Workbench, optional but useful for inspecting the database
- Docker Desktop, optional for the Docker Compose setup
- RabbitMQ, optional locally unless using Docker Compose
- Redis, optional locally unless using Docker Compose
- Prometheus and Grafana, optional locally unless using Docker Compose

## 2. Environment

Backend environment values are stored in `server/.env`.

Expected values:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=packup_db
JWT_SECRET=your_secret_key
PORT=5000
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
```

The frontend uses `http://localhost:3000`.
The backend uses `http://localhost:5000`.

## 3. Install Dependencies

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

## 4. Database Setup

Create the MySQL database if it does not exist:

```sql
CREATE DATABASE packup_db;
```

Run backend migrations from the `server` folder:

```bash
npm run migrate:integrity
npm run migrate:audit
npm run migrate:events
npm run migrate:search
npm run migrate:notifications
```

These migrations prepare indexes, audit logs, event logs, full-text search, and notifications.

## 5. RabbitMQ Event Queue

RabbitMQ is used for event-driven processing when it is available.

Events are still saved in MySQL first, then published to RabbitMQ:

```text
Express API -> event_logs table -> RabbitMQ exchange -> event worker -> processed event
```

The RabbitMQ setup includes:

- main exchange: `packup.events`
- main queue: `packup.events.main`
- dead letter exchange: `packup.events.dlx`
- dead letter queue: `packup.events.dlq`

Start the event worker from the `server` folder:

```bash
npm run worker:events
```

If RabbitMQ is not running, the main app still works and stores events in MySQL. RabbitMQ publishing will be skipped with a warning.

## 6. Redis Cache

Redis is used as the external cache layer when it is available.

Currently cached data:

- top-rated trips / review summary data

If Redis is not running, the backend falls back to in-memory cache so the app continues working.

When using Docker Compose, Redis runs on:

```text
localhost:6379
```

## 7. Start The App

Start the backend:

```bash
cd server
npm start
```

If `npm start` is not configured in the backend, run:

```bash
node index.js
```

Start the frontend in a second terminal:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## 8. Health And Monitoring Checks

Check if the backend is alive:

```text
http://localhost:5000/health
```

Check if the backend and database are ready:

```text
http://localhost:5000/ready
```

Check Prometheus-style metrics:

```text
http://localhost:5000/metrics
```

When using Docker Compose, Prometheus is available at:

```text
http://localhost:9090
```

Grafana is available at:

```text
http://localhost:3001
```

Default Grafana credentials:

```text
username: admin
password: admin
```

Grafana is preconfigured with a Prometheus datasource and a PackUp Overview dashboard.

Check API documentation:

```text
http://localhost:5000/api/docs
```

## 9. Quality Checks

Run frontend lint and production build:

```bash
npm run check
```

Run backend syntax/static check:

```bash
cd server
npm run check
```

These checks are also included in GitHub Actions CI.

## 10. Feature Checklist

- Authentication with JWT
- Role-based access for user, trip planner, and admin
- Trip management
- Review management with one review per user per trip
- Edit review flow
- Full-text trip search
- Redis-backed cache with in-memory fallback
- Admin dashboard
- Analytics cards and charts
- Audit logs
- Event logs
- RabbitMQ event publishing
- Dead Letter Queue setup
- Notifications
- Health and readiness endpoints
- Metrics endpoint
- Prometheus monitoring stack
- Grafana dashboard
- OpenAPI-style API documentation
- Docker Compose files
- CI checks with GitHub Actions

## 11. Common Issues

### Frontend dev server allowedHosts error

Check `.env.development` in the project root. It should include:

```env
HOST=localhost
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

Then restart the frontend.

### Backend cannot connect to MySQL

Check:

- MySQL Server is running
- `server/.env` has the correct database credentials
- `packup_db` exists
- migrations were run from the `server` folder

### Search does not rank correctly

Run:

```bash
cd server
npm run migrate:search
```

Then restart the backend.

### Notifications do not appear

Run:

```bash
cd server
npm run migrate:notifications
```

Then restart the backend and test with two roles:

- trip planner creates a trip
- normal user checks Notifications
- normal user leaves a review
- trip planner checks Notifications

### RabbitMQ does not connect

If running locally without Docker, check:

- RabbitMQ is installed and running
- `RABBITMQ_URL` in `server/.env` is correct
- `amqplib` is installed in the `server` folder

If using Docker Compose, open the RabbitMQ management UI:

```text
http://localhost:15672
```

Default Docker credentials:

```text
username: packup
password: packup_password
```

### Redis does not connect

If running locally without Docker, check:

- Redis is installed and running
- `REDIS_URL` in `server/.env` is correct
- `redis` package is installed in the `server` folder

If Redis is unavailable, the app falls back to in-memory cache.

### Prometheus or Grafana does not show metrics

If using Docker Compose, check:

- API container is running
- Prometheus container is running
- Grafana container is running
- `http://localhost:5000/metrics` returns metrics
- Prometheus target `api:5000` is up

Prometheus URL:

```text
http://localhost:9090
```

Grafana URL:

```text
http://localhost:3001
```

## 12. Submission Notes

A zip of the code does not automatically include the local MySQL database data.

For submission, include one of these:

- a MySQL database export `.sql` file
- or clear setup instructions using `server/db/init.sql` and migrations

Recommended final package:

- project source code
- database export
- setup instructions
- professor documentation
