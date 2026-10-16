# Contributing

## Testing conventions

We use **Vitest** with **React Testing Library** for unit and component tests, and **Playwright** for
end-to-end (E2E) tests.

### Commands

- `npm test`: run all unit and component tests once.
- `npm run test:watch`: re-run tests on file changes while developing.
- `npm run test:coverage`: run tests and generate a coverage report in `coverage/` (open
  `coverage/index.html`).
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
