# Piano Habit Tracker

A web app that helps pianists build a practice habit and measure real technical progress. Log your
practice, track every scale and exercise with clean versus maximum tempo, and see your progress in a
GitHub-style activity heat map and in charts.

> **Status:** early development. The project foundation (Epic 1) is in place, and features are being
> built epic by epic.

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
| 2    | Data models, database and backend API      | Planned |
| 3    | Authentication and dashboard               | Planned |
| 4    | Scale tracker                              | Planned |
| 5    | Hanon and technical exercises              | Planned |
| 6    | Progress analytics and charts              | Planned |
| 7    | Metronome, neglected scales system, polish | Planned |

## Tech stack

- [Next.js](https://nextjs.org) (App Router), React 19 and TypeScript (strict)
- Tailwind CSS and shadcn/ui
- Zod for validation
- Vitest, Testing Library and Playwright for testing
- GitHub Actions for CI

Planned in later epics: PostgreSQL with Prisma, Better Auth and Recharts. See the
[architecture notes](./docs/architecture.md) and the [decision records](./docs/adr/README.md).

## Getting started

### Requirements

- Node.js 22 (see `.nvmrc`; Node 20.9 or newer works)
- npm
- Git

No database is needed yet. PostgreSQL arrives in Epic 2.

### Setup

```bash
git clone https://github.com/mgonzalezdicarlo/ThePianoProject.git
cd ThePianoProject
npm install
```

Create your local environment file. On macOS and Linux use `cp`; in PowerShell, `cp` also works, or
use `Copy-Item`:

```bash
cp .env.example .env.local
```

Start the development server and open http://localhost:3000:

```bash
npm run dev
```

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
