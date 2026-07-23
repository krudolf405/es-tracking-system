# Architecture Overview

## Monorepo Structure

This project uses a simple root-level monorepo with npm workspaces. The root `package.json` defines shared scripts, and each `apps/*` directory contains its own `package.json`.

## Strict Coding Standards

### TypeScript
- **No `any` types** are allowed anywhere. Use proper generics, interfaces, or `unknown` with type narrowing.
- Strict mode is enabled in all `tsconfig.json` files.
- All files must pass `tsc --noEmit` without errors.

### API Routes (Backend - NestJS)
- Every route must be defined in a controller class with decorators.
- All request bodies must be validated using Zod schemas or NestJS pipes.
- Every endpoint must include a Swagger decorator (`@ApiOperation`, `@ApiTags`, etc.).

### Database Access (Drizzle ORM)
- All database access must occur via Drizzle schema definitions in `src/database/schema.ts`.
- Raw SQL queries are forbidden unless absolutely necessary and must be approved.
- Migrations are managed via `drizzle-kit` and stored in the `drizzle/` directory.

### Environment Variables
- All environment variables are validated using Zod schemas (see `src/config/env.config.ts` in backend).
- Frontend environment variables must use the `VITE_` prefix.
- Never commit sensitive values; use `.env.example` files for documentation.

### Frontend (React + Vite)
- Use functional components with TypeScript interfaces for props.
- API calls go through `axios` instances (configured in a future phase).
- Routing is managed by `react-router-dom`.

### Docker
- Development uses Docker Compose with volume mounts for hot-reloading.
- Never use machine-specific paths in Docker configurations.
- The `.env` file at root supplies all container environment variables.

## Future Phases

1. Phase 2: Database Schema Design & Authentication (JWT, roles)
2. Phase 3: QR Code Generation & Scanning
3. Phase 4: Examination Session Management
4. Phase 5: Real-time Reporting Dashboard
