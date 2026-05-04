# PackUp Project

This project can be run either with Docker Desktop or with a manual local setup. For submission, the recommended path is Docker because it starts the frontend, backend, database, queue, cache, and monitoring stack together.

## Recommended: Run With Docker

Requirements:

- Docker Desktop installed and running

If you want a fresh demo setup with the seeded trips, users, reviews, and monitoring data, start from a clean Docker volume state first:

```bash
docker compose down -v
```

Steps:

1. Open a terminal in the project root.
2. Run:

```bash
docker compose up --build
```

3. Open the app at:

```text
http://localhost:3000
```

Additional services:

- API health: `http://localhost:5000/health`
- API docs: `http://localhost:5000/api/docs`
- RabbitMQ management: `http://localhost:15672`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

Default credentials included in the Docker setup:

- Admin: `admin@packup.local` / `admin123`
- Planner: `planner@packup.local` / `planner123`
- Traveler: `user@packup.local` / `user123`
- Traveler 2: `traveler2@packup.local` / `user123`
- RabbitMQ user: `packup`
- RabbitMQ password: `packup_password`
- Grafana user: `admin`
- Grafana password: `admin`

To stop the containers:

```bash
docker compose down
```

To stop the containers and remove persistent Docker volumes:

```bash
docker compose down -v
```

## Manual Local Run

If you want to run the project without Docker, use the detailed instructions in [RUNBOOK.md](C:/Users/laura/OneDrive/Desktop/packup_project_app/RUNBOOK.md).

## Notes

- The Docker setup initializes the MySQL demo data from `DATABASE/submission_database.sql`.
- The frontend now uses relative `/api/...` requests so it works both with the React dev server proxy and with Docker + Nginx.
