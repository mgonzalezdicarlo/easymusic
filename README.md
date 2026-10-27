# Piano Habit Tracker

A web app that helps pianists build a practice habit and measure real technical progress. Log your
practice, track every scale and exercise with clean versus maximum tempo, and see your progress in a
GitHub-style activity heat map and in charts.

> **Status:** early development.

## Features

- **Activity heat map and streaks:** a GitHub-style practice grid with current and longest streak.
- **Scale tracker:** catalog scales by key and mode, with octaves (1-4), hands (separate or
  together), target BPM and current clean BPM.
- **Hanon and Czerny module:** Hanon exercises 1-60 pre-loaded, plus your own custom exercises, with
  BPM tracking.
- **Analytics:** BPM progression line charts and practice time distribution charts.
- **Clean versus max tempo:** every entry records both the tempo you play cleanly and the fastest you
  reached.
- **Embedded metronome** (optional) and a **neglected scales** reminder.

## Roadmap

| Epic | Scope                                      | Status  |
| ---- | ------------------------------------------ | ------- |
| 1    | Project setup and architecture             | Done    |
| 2    | Data models, database and backend API      | Done |
| 3    | Authentication and dashboard               | Done |
| 4    | Scale tracker                              | Planned |
| 5    | Hanon and technical exercises              | Planned |
| 6    | Progress analytics and charts              | Planned |
| 7    | Metronome, neglected scales system, polish | Planned |

## Tech stack

- [Next.js](https://nextjs.org) (App Router), React 19 and TypeScript (strict)
- Tailwind CSS and shadcn/ui
- PostgreSQL and Prisma
- Zod for validation
- Better Auth for authentication
- Vitest, Testing Library and Playwright for testing
- GitHub Actions for CI

Planned in later epics: Recharts. See the
[architecture notes](./docs/architecture.md) and the [decision records](./docs/adr/README.md).

## Getting started

### Requirements

- Node.js 22 (see `.nvmrc`; Node 20.19 or newer works)
- npm
- Git
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (PostgreSQL runs in a container)

### Setup

```bash
git clone https://github.com/mgonzalezdicarlo/ThePianoProject.git
cd ThePianoProject
cp .env.example .env.local
npm install
npm run db:up
npm run db:migrate
npm run dev
```

Open http://localhost:3000. In PowerShell, use `Copy-Item .env.example .env.local` if `cp` is not
available.

Create `.env.local` **before** `npm install`: installing generates the Prisma client, which reads
`DATABASE_URL`.

### Environment variables

Copy `.env.example` to `.env.local`. The app validates these at startup and stops with a clear
message if one is missing or invalid.

| Variable               | Required | Description                                                |
| ---------------------- | -------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`  | Yes      | Public URL of the app, for example `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | No       | Display name. Defaults to `Piano Habit Tracker`            |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string (server only)                 |
| `BETTER_AUTH_SECRET`   | Yes      | Secret that signs sessions, 32+ characters (server only)   |
| `GITHUB_CLIENT_ID`     | No       | GitHub OAuth app id. Set with the secret to enable sign-in |
| `GITHUB_CLIENT_SECRET` | No       | GitHub OAuth app secret (server only)                      |

## Database

PostgreSQL 17 runs in Docker Compose (`docker-compose.yml`) and is accessed with Prisma. Make sure
Docker Desktop is running, then:

| Script                                                                                       | What it does                                                                  |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run db:up`                                                                              | Start PostgreSQL and wait until it is healthy                                 |
| `npm run db:down`                                                                            | Stop PostgreSQL (data is kept)                                                |
| `npm run db:migrate`                                                                         | Create and apply migrations in development. Name a new one with `-- --name x` |
| `npm run db:deploy`                                                                          | Apply existing migrations without creating new ones (CI and production)       |
| `npm run db:generate`                                                                        | Regenerate the Prisma client (also runs on `npm install`)                     |
| `npm run db:reset`                                                                           | Drop the database, re-apply all migrations and run the seed                   |
| `npm run db:seed`                                                                            | Run `prisma/seed.ts`                                                          |
| `npm run db:studio`                                                                          | Open Prisma Studio at http://localhost:5555                                   |
| `npm run test:e2e` needs the database running (`npm run db:up`) because of the health check. |

- The default connection is `postgresql://piano:piano@localhost:5432/piano`. Data lives in a Docker
  volume and survives restarts. `docker compose down -v` deletes it.
- The schema is in `prisma/schema.prisma`, and the generated client in `src/generated/prisma`
  (ignored by Git). Import the shared client from `@/server/db`.
- **Port 5432 already in use?** Stop your local PostgreSQL service, or change the port in
  `docker-compose.yml` (for example `127.0.0.1:5433:5432`) and in `DATABASE_URL`.
- `GET /api/health` returns `{"status":"ok","database":"up"}` when the app can reach the database.

### Environment variables

Copy `.env.example` to `.env.local`. The app validates these at startup and stops with a clear
message if one is missing or invalid.

| Variable               | Required | Description                                                |
| ---------------------- | -------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`  | Yes      | Public URL of the app, for example `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | No       | Display name. Defaults to `Piano Habit Tracker`            |

## Scripts

| Script                  | What it does                                                   |
| ----------------------- | -------------------------------------------------------------- |
| `npm run dev`           | Start the development server                                   |
| `npm run build`         | Create a production build                                      |
| `npm start`             | Serve the production build                                     |
| `npm run lint`          | Run ESLint (zero warnings allowed)                             |
| `npm run lint:fix`      | Run ESLint and fix what it can                                 |
| `npm run format`        | Format all files with Prettier                                 |
| `npm run format:check`  | Check formatting without changing files                        |
| `npm run typecheck`     | Run the TypeScript compiler without emitting files             |
| `npm test`              | Run unit and component tests once                              |
| `npm run test:watch`    | Run tests in watch mode                                        |
| `npm run test:coverage` | Run tests and generate a coverage report in `coverage/`        |
| `npm run test:e2e`      | Run the Playwright end-to-end tests                            |
| `npm run verify`        | Format check, lint, typecheck, tests and build: the same as CI |

Before the first E2E run, install the browser once with `npx playwright install chromium`.

## Project structure

```
src/
    app/          Routes, layouts and pages
    components/   Shared UI (ui/ holds the shadcn/ui primitives)
    features/     One folder per product feature
lib/              Generic helpers and environment validation
server/           Server-only code
e2e/              Playwright end-to-end tests
docs/             Architecture notes and decision records
```

## Quality

Pull requests must pass formatting, linting, type checking, unit tests, a production build and E2E
tests in GitHub Actions. Git hooks (Husky) format and lint staged files and enforce
[Conventional Commits](https://www.conventionalcommits.org).

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the branching model, commit style, testing
conventions and the pull request checklist.
