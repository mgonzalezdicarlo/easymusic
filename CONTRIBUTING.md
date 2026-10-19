# Contributing

Thanks for helping build the Piano Habit Tracker. This guide explains how we work.

## Getting started

1. Install Node.js 22 (see `.nvmrc`), Git and Docker Desktop.
2. Clone the repository and copy `.env.example` to `.env.local`.
3. Run `npm install`. This installs the Git hooks and generates the Prisma client.
4. Run `npm run db:up` to start PostgreSQL, then `npm run db:migrate` to apply the migrations.
5. Run `npm run dev`, then open http://localhost:3000.

Work is planned as GitHub issues grouped into milestones (one per epic). Pick an open issue, or open
one using the bug or feature template, before you start coding.

## Branching model

`main` is always releasable and is protected: changes arrive only through pull requests with passing
checks and one approving review.

Create a short-lived branch per issue, named `<type>/<issue-id>-<short-description>`:

```
feat/e3-05-activity-heatmap
fix/e3-04-streak-timezone
chore/e1-05-ci-github-actions
docs/e1-06-repository-hygiene
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `ci`, `test`, `refactor`.

If your work depends on a pull request that is not merged yet, branch from that PR's branch and set
it as the base of your PR. GitHub retargets your PR to `main` automatically when the first one
merges.

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org), enforced by commitlint:

```
<type>(optional scope): <short summary in lowercase>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`.
- Use the imperative mood ("add heat map", not "added heat map"), no trailing period, and keep the
  first line under 100 characters.
- Reference the roadmap issue at the end when there is one.

Examples:

```
feat(scales): log clean and max tempo for a scale (E4-03)
fix(streaks): handle daylight saving changes (E3-04)
docs: add architecture decision record for charts
```

Do not bypass the hooks with `--no-verify`. If a hook fails, fix the reported problem.

## Code style

- **Prettier** formats all files, **ESLint** enforces code rules and import order, and TypeScript
  runs in strict mode. Run `npm run format` and `npm run lint:fix` to fix most problems.
- Use the `@/` alias for imports from `src`.
- Keep business rules in plain TypeScript modules, separate from React components and database code.
- Validate all external input (API requests, environment variables) with Zod.
- Never commit secrets or `.env` files. When you add an environment variable, update both
  `.env.example` and `src/lib/env.ts`.
- Build API endpoints with the helpers in `src/server/api` and follow the [API conventions](./docs/api-conventions.md).

## Pull requests

1. Keep each pull request focused on one issue.
2. Make sure `npm run verify` and `npm run test:e2e` pass locally.
3. Push your branch and open a PR. The template asks for a summary, the related issue
   (`Closes #<number>`), how to test it, and screenshots for UI changes.
4. Wait for the **Quality** and **E2E** checks to pass and for a review. Address comments with new
   commits.
5. Squash and merge, then delete the branch.

### Pull request checklist

- [ ] The PR is linked to an issue and has a Conventional Commits title
- [ ] `npm run verify` passes locally
- [ ] Tests are added or updated
- [ ] E2E tests are updated if a critical user journey changed
- [ ] `.env.example` and `src/lib/env.ts` are updated if needed
- [ ] Documentation and ADRs are updated where needed
- [ ] UI changes were checked on mobile and desktop, in light and dark themes

## Issues, labels and milestones

- Each epic is a **milestone**, and each roadmap task is an issue inside it.
- Labels describe the area (`frontend`, `backend`, `database`, `infra`, `devops`, `testing`, `docs`,
  `design`, `analytics`, `auth`, `a11y`), the kind of work (`enhancement`, `bug`) and the priority
  (`priority: high`, `priority: medium`, `priority: low`). `optional` marks nice-to-have work.

## Architecture decisions

Architecture notes live in [`docs/architecture.md`](./docs/architecture.md). Significant decisions
are recorded as ADRs in [`docs/adr`](./docs/adr/README.md). Write a new ADR when you introduce a
framework or library, or change a rule that affects several features. Never edit an accepted ADR;
supersede it with a new one.

## Testing conventions

We use **Vitest** with **React Testing Library** for unit and component tests, and **Playwright** for
end-to-end (E2E) tests.

### Commands

- `npm test`: run all unit and component tests once.
- `npm run test:watch`: re-run tests on file changes while developing.
- `npm run test:coverage`: run tests and generate a coverage report in `coverage/` (open
  `coverage/index.html`).
- `npm run test:integration`: run the `*.integration.test.ts` API tests against the `piano_test` database. They are excluded from `npm test`. It needs PostgreSQL (`npm run db:up`), creates the database and applies migrations on the first run, and refuses any database name not ending in `_test`.
- `npm run test:e2e`: run the Playwright E2E tests. It starts the app automatically, or reuses a
  dev server that is already running on port 3000.
- `npx playwright test --ui`: debug E2E tests interactively.

### Where tests live

- **Unit and component tests** sit next to the code they test, named `*.test.ts` or `*.test.tsx`
  (for example `page-header.tsx` and `page-header.test.tsx`).
- **E2E tests** live in the `e2e/` folder and are named `*.spec.ts`.
- Import from the `@/` alias, as in application code.

### Guidelines

- Test behavior, not implementation details. Query by role, label or visible text
  (`getByRole`, `getByLabelText`, `getByText`) and avoid test IDs unless there is no accessible
  alternative.
- Use `@testing-library/user-event` for interactions instead of `fireEvent`.
- Keep pure logic (streaks, status rules, scoring) in plain TypeScript modules so it can be unit
  tested without rendering anything.
- Each test must be independent. Reset mocks and environment changes (`vi.stubEnv`) rather than
  sharing state between tests.
- Do not write tests for generated code in `src/components/ui`.
- Add or update an E2E test when you change a critical user journey (sign-up, logging practice,
  tracking a scale or exercise).
- Every pull request must keep `npm test` and `npm run test:e2e` passing.

## Continuous integration

Every pull request runs two GitHub Actions jobs, defined in `.github/workflows/ci.yml`:

- **Quality**: formatting check, ESLint, TypeScript, unit tests with coverage and a production
  build.
- **E2E**: Playwright tests against a production build, with a Postgres service container.

Both jobs must pass before a pull request can be merged, and it needs one approving review.
Run the same checks locally with `npm run verify` and `npm run test:e2e`. Coverage and Playwright
reports are attached to every run as downloadable artifacts.
