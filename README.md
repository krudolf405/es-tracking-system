# Examination Session Tracking System

A containerized monorepo for managing examination sessions, tracking student attendance via QR codes, managing invigilators, and providing real-time reporting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | NestJS, TypeScript, Drizzle ORM |
| Database | PostgreSQL 16 |
| Validation | Zod (frontend & backend) |
| Containerization | Docker & Docker Compose |
| Code Quality | ESLint, Prettier |

## Project Structure

```
exam-tracking-system/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── config/   # Environment validation (Zod)
│   │   │   ├── database/ # Drizzle connection & schema
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── main.ts
│   │   └── drizzle.config.ts
│   └── frontend/         # React Vite SPA
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── postcss.config.js
├── packages/              # Shared packages (future)
├── docker-compose.yml     # Orchestrates all services
├── .env                   # Environment variables
└── tsconfig.base.json     # Shared TypeScript config
```

## Quick Start

### Prerequisites
- Docker & Docker Compose installed

### Running the Application

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Database Migrations

```bash
# Generate a new migration after schema changes
npm run db:generate

# Apply migrations to the database
npm run db:migrate
```

### Accessing the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/health |

## Development (without Docker)

```bash
# Install dependencies (from root)
npm install

# Start backend
npm run backend:dev

# Start frontend (in another terminal)
npm run frontend:dev
```

## Code Quality

```bash
# Lint all projects
npm run lint

# Type-check all projects
npm run typecheck
```
