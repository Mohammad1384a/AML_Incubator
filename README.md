# AML Incubator Expense Tracker

A full-stack expense tracker technical assessment built as a pnpm monorepo.

## Overview

This project contains:

- **API**: NestJS + Prisma 7 + PostgreSQL
- **Web**: Next.js App Router + React + React Hook Form + Zod
- **Database**: PostgreSQL
- **Auth**: cookie-based JWT authentication
- **Testing**: backend e2e tests with Jest + Supertest

The application supports:

- user registration and login
- protected dashboard
- create, read, update, and delete expenses
- filtering expenses by category and date range
- summary totals
- user ownership enforcement so one user cannot access another user’s expenses

---

## Monorepo structure

```text
apps/
  api/   -> NestJS backend
  web/   -> Next.js frontend
packages/
  shared/ -> shared package slot for future shared code
```

---

## Tech stack

### Backend

- NestJS
- Prisma 7
- `@prisma/adapter-pg`
- PostgreSQL
- Passport JWT
- class-validator / class-transformer
- bcrypt

### Frontend

- Next.js 16
- React 19
- React Hook Form
- Zod
- App Router
- Proxy-based route protection

### Tooling

- pnpm workspaces
- Docker / Docker Compose
- Jest / Supertest
- Vitest (frontend test slot prepared)

---

## Key project decisions

### 1) Prisma 7 setup

The backend uses Prisma 7 with:

- `prisma.config.ts`
- generated client output under `apps/api/src/generated/prisma`
- PostgreSQL adapter via `@prisma/adapter-pg`

### 2) Authentication strategy

Authentication is handled with:

- register / login endpoints
- JWT stored in an `access_token` httpOnly cookie
- protected backend routes using `JwtAuthGuard`
- protected frontend dashboard route via `proxy.ts`

### 3) Authorization / ownership

Expense queries are always scoped by `userId`.

That means:

- users only see their own expenses
- cross-user fetch/update/delete returns `404`
- summaries are user-scoped as well

### 4) Frontend behavior

- `/dashboard` is protected
- `/` redirects to `/dashboard` only when the current session is valid
- login and register use hard redirects after successful auth so the cookie is visible to server-side routing immediately

### 5) Docker strategy

Docker Compose runs:

- `db`
- `api`
- `web`

The API container runs Prisma migrations on startup with:

```sh
prisma migrate deploy
```

---

## Environment variables

### API: `apps/api/.env`

Create this file locally:

```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aml_incubator?schema=public"
JWT_SECRET="local-dev-super-secret"
```

### Web: `apps/web/.env`

Create this file locally:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
API_INTERNAL_BASE_URL=http://api:3001/api
```

### Notes

- `NEXT_PUBLIC_API_BASE_URL` is used by the browser
- `API_INTERNAL_BASE_URL` is used by server-side calls inside the web app
- when using Docker locally, browse with `localhost`, not a random LAN IP, unless you intentionally rebuild the web image with a different public API URL

---

## Local setup (step by step)

### 1) Prerequisites

Install:

- **Node.js 22** recommended
- **pnpm** via Corepack
- **Docker Desktop** (or Docker Engine with Compose)

### 2) Clone the repository

```bash
git clone <your-repository-url>
cd AML_Incubator
```

### 3) Enable pnpm and install dependencies

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install
```

### 4) Create environment files

Create:

- `apps/api/.env`
- `apps/web/.env`

Using the values shown above.

### 5) Start PostgreSQL with Docker

```bash
docker compose up -d db
```

### 6) Generate Prisma client

```bash
pnpm --filter @aml/api prisma:generate
```

### 7) Apply database migrations

If the database is empty:

```bash
pnpm --filter @aml/api exec prisma migrate dev
```

If you want to name the migration explicitly after schema changes:

```bash
pnpm --filter @aml/api exec prisma migrate dev --name your_migration_name
```

### 8) Start the backend

```bash
pnpm --filter @aml/api start:dev
```

API should be available at:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/api/health
```

### 9) Start the frontend

In a second terminal:

```bash
pnpm --filter @aml/web dev
```

Frontend should be available at:

```text
http://localhost:3000
```

### 10) Test the full flow

Suggested sanity check:

1. Open `http://localhost:3000/register`
2. Create an account
3. Confirm redirect to `/dashboard`
4. Create a few expenses
5. Edit and delete one
6. Use filters
7. Verify summary changes
8. Logout
9. Confirm `/dashboard` redirects back to login

---

## Running tests

### Backend e2e tests

```bash
pnpm --filter @aml/api test:e2e
```

### Full workspace tests

```bash
pnpm test
```

---

## Docker setup

### Build and run everything

```bash
docker compose up --build
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- DB: `localhost:5432`

### Stop containers

```bash
docker compose down
```

### Stop containers and remove DB volume

```bash
docker compose down -v
```

Use `-v` only when you intentionally want to wipe the database.

---

## API contract summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Expenses

- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/expenses/:id`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/expenses/summary`

### Supported expense categories

- `FOOD`
- `TRANSPORT`
- `ENTERTAINMENT`
- `HEALTH`
- `UTILITIES`

---

## Project quality notes

This project currently emphasizes:

- backend correctness
- ownership-safe authorization
- end-to-end test coverage for auth and expenses
- a polished dashboard flow
- Dockerized local development

Still good follow-up improvements if needed:

- add frontend unit/integration tests
- add CI workflow for build + tests
- improve production secret management
- add more dashboard polish and charts
- add pagination for large expense lists

---

## Common troubleshooting

### I log in but still get redirected strangely

Use the same host consistently:

- prefer `localhost:3000`
- avoid switching between `localhost` and `192.168.x.x` during the same run

### The home page redirects but dashboard does not load

Check:

- API is running
- database is running
- `access_token` cookie exists
- `/api/auth/me` returns `200`

### Prisma errors in Docker

Make sure:

- database container is healthy
- `DATABASE_URL` inside Compose points to `db:5432`
- you are using `prisma migrate deploy` in container startup

### The app compiles but the DB is out of sync

Run:

```bash
pnpm --filter @aml/api prisma:generate
pnpm --filter @aml/api exec prisma migrate dev
```

---

## Submission summary

This implementation delivers:

- full-stack expense tracking
- backend authentication and authorization
- secure ownership enforcement
- filtering and summaries
- Dockerized local execution
- test-backed backend flows
