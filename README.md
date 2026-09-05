# Examination Session Tracking System

A full-stack monorepo for managing examination sessions, tracking student attendance via QR codes, managing invigilators, handling room capacity/overflow, and providing real-time dashboards and reports.

## Features

- **Role-based dashboards** — Admin, Student, and Invigilator portals.
- **QR attendance** — Students get a personal QR code; invigilators scan to **sign in** and **sign out**.
- **Bulk QR download** — Students can download one QR per enrolled course unit as a ZIP.
- **Progress tracking** — Per-exam progress shows 0% (not started), 50% (signed in), 100% (signed out).
- **Absent/present reports** — Admin sees who expected vs. who attended for each active session.
- **Room capacity & overflow** — Detects when a session exceeds a room's capacity and lets you allocate an overflow room (with invigilators).
- **Invigilator remarks** — Invigilators can add/update remarks on completed sessions.
- **Incident logging** — Invigilators log malpractice / technical issues in real time.
- **Reports** — Export attendance (Excel/PDF) and incident reports.
- **Real-time updates** — WebSocket-driven live refresh of attendance stats.
- **Clickable stat cards** — Drill into totals (present, late, absent, students) on the admin dashboard.

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend      | NestJS, TypeScript, Drizzle ORM, Socket.IO |
| Database     | PostgreSQL 16                           |
| Containerization | Docker & Docker Compose             |
| Validation   | Zod + class-validator                  |
| Code Quality | ESLint, Prettier, TypeScript            |

## Repository Layout

```
exam-tracking-system/
├── apps/
│   ├── backend/               # NestJS API server
│   │   └── src/database/
│   │       ├── schema.ts      # Drizzle schema (tables & enums)
│   │       ├── seed.ts        # Demo data (students, invigilators, exams)
│   │       └── migrate-all.ts # Applies every drizzle/*.sql migration
│   └── frontend/              # React + Vite single-page app
├── drizzle/                   # SQL migration files (0000–0005)
├── docker-compose.yml         # PostgreSQL + backend + frontend
├── Dockerfile.backend         # Backend container image
├── Dockerfile.frontend        # Frontend container image
├── .env.example               # Environment template (copy to .env)
└── package.json               # Workspace scripts (dev, build, db:*)
```

## Ports

| Service  | Native (non-Docker) | Docker Compose |
|----------|---------------------|----------------|
| Frontend | http://localhost:5173 | http://localhost:5173 |
| Backend  | http://localhost:3010  | http://localhost:3010 (container :3000) |
| Database | localhost:5433        | localhost:5433 (container :5432) |
| Health   | http://localhost:3010/health | http://localhost:3010/health |

> **Note:** the host port for the backend is **3010** (not 3000). `.env` already contains the correct values.

---

## Option 1 — Run with Docker (recommended, easiest on another machine)

This runs the whole system (PostgreSQL, backend, frontend) as containers, so the only thing you need installed is **Docker**.

### 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (includes Docker Compose v2).
- [Git](https://git-scm.com/).

Verify Docker is ready:

```bash
docker --version
docker compose version
```

### 2. Clone and configure

```bash
git clone https://github.com/krudolf405/es-tracking-system.git
cd es-tracking-system
```

Create your environment file from the template:

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for a local Docker install. Adjust `POSTGRES_*`, `JWT_SECRET`, and the ports only if you need to.

### 3. Start the containers

```bash
docker compose up -d --build
```

- `-d` runs in the background.
- `--build` builds the backend/frontend images the first time (and rebuilds after code changes).

### 4. Apply database migrations

The database needs its tables created. From the repo root, when the `db` container is healthy:

```bash
# If the backend container is running, run migrations inside it:
docker compose exec backend npm run db:migrate:all

# Otherwise, run them on your host against the container's DB:
npm run db:migrate:all
```

Migrations are **idempotent** (they track which SQL files have already run), so it is safe to run them more than once.

### 5. Seed demo data (optional but recommended)

```bash
# Run inside the backend container:
docker compose exec backend npm run db:seed

# Or from the host:
npm run db:seed
```

Seeding creates **10 students**, **3 invigilators**, exam rooms, exam sessions, and course enrollments. Running it again is safe — it will not create duplicates.

> The frontend build bakes the API URL (`VITE_API_URL`) at build time, so if you change it in `.env`, rerun `docker compose up -d --build`.

### 6. Access the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3010 |
| Health Check | http://localhost:3010/health |

### Docker Compose — common commands

```bash
docker compose up -d --build   # build + start
docker compose logs -f         # stream logs
docker compose ps              # list services/status
docker compose down            # stop containers (keeps data)
docker compose down -v         # stop AND delete the database volume (fresh start)
```

### Stop and reset (fresh database)

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend npm run db:migrate:all
docker compose exec backend npm run db:seed
```

---

## Option 2 — Run without Docker (native development)

Here only the database runs in a container; the backend and frontend run directly on your machine using Node.js. Useful for active development with hot reload.

### 1. Prerequisites

- **Node.js 20+** and **npm**
- **Docker** (only to run the PostgreSQL container)

### 2. Clone and configure

```bash
git clone https://github.com/krudolf405/es-tracking-system.git
cd es-tracking-system
cp .env.example .env
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the database container

```bash
docker compose up -d db
```

This starts only the `db` service (PostgreSQL) mapped to host port **5433**.

### 5. Verify the DB is healthy

```bash
docker compose ps
# the "db" service should show healthy
```

### 6. Apply migrations and seed

```bash
npm run db:migrate:all   # create tables (idempotent)
npm run db:seed          # demo data
```

### 7. Run backend + frontend (two terminals, or one command)

**One terminal (both):**

```bash
npm run dev
```

**Or two terminals separately:**

```bash
# terminal 1 — backend on :3010
npm run backend:dev

# terminal 2 — frontend on :5173
npm run frontend:dev
```

### 8. Access the app

Same URLs as above: frontend http://localhost:5173, backend http://localhost:3010.

---

## Running the services reliably (auto-restart)

The `npm run dev` / `npm run backend:dev` commands need an open terminal and
stop when the shell exits. To keep the site up continuously (and survive the
backend or frontend being killed, e.g. by the OS under memory pressure), use
the supervisor:

```bash
npm run start:services    # starts backend + frontend from compiled build, auto-restarts if they die
```

### Auto-start at boot (systemd)

On Linux, the supervisor can run as a systemd **user** service so it starts
automatically at boot and is restarted if it ever exits:

```bash
mkdir -p ~/.config/systemd/user
# edit ~/.config/systemd/user/exam-tracking-supervisor.service to point at your repo:
cat > ~/.config/systemd/user/exam-tracking-supervisor.service <<'EOF'
[Unit]
Description=Exam Tracking System - backend & frontend supervisor

[Service]
Type=simple
WorkingDirectory=/home/<you>/es-tracking-system
ExecStart=/bin/bash /home/<you>/es-tracking-system/scripts/ensure-services.sh
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable exam-tracking-supervisor.service   # start at boot
systemctl --user start exam-tracking-supervisor.service    # start now
```

Ensure the user services survive logout/reboot (no GUI session required):

```bash
loginctl enable-linger "$USER"
```

The supervisor waits for the PostgreSQL database (default `127.0.0.1:5433`)
before starting the backend, so it is safe for the DB container and the
supervisor to start at boot in parallel. To point it at a different database,
set `DB_HOST` / `DB_PORT` (e.g. `DB_HOST=db` inside Docker).

---

## Default demo accounts (after seeding)

| Role       | Email                   | Password    |
|------------|-------------------------|-------------|
| Admin      | admin@example.com        | admin123    |
| Invigilator | invigilator@example.com | invig123    |
| Invigilator | invigilator2@example.com | invig123    |
| Invigilator | invigilator3@example.com | invig123    |
| Student    | student@example.com      | student123  |
| Student    | student2@example.com     | student123  |
| …          | student3 … student10@example.com | student123 |

Seeded students use matric numbers `MAT/2024/001` through `MAT/2024/010`.

## Useful npm scripts (run from repo root)

| Script             | Description                                        |
|--------------------|----------------------------------------------------|
| `npm run dev`      | Start backend + frontend together (native)        |
| `npm run start:services` | Run backend + frontend with auto-restart supervisor |
| `npm run backend:dev` | Backend dev server (watch mode, :3010)         |
| `npm run frontend:dev` | Frontend dev server (:5173)                    |
| `npm run db:migrate:all` | Apply all SQL migrations (idempotent)        |
| `npm run db:seed`  | Seed demo students, invigilators, exams           |
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:migrate` | Drizzle-kit migrate (journal-based)            |
| `npm run build`    | Build backend + frontend for production           |
| `npm run lint`     | Lint all projects                                  |
| `npm run typecheck`| Type-check all projects                            |

## Code Quality

```bash
npm run lint
npm run typecheck
npm run build
```

## License

This project is an educational/demonstration system.
