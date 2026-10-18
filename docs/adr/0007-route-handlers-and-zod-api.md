# ADR-0007: Build the backend API with route handlers and Zod

- **Status:** Proposed
- **Date:** 2026-10-17

## Context

Epic 2 adds many endpoints (sessions, tracked scales and exercises, analytics). They must validate
input the same way, return one error shape, paginate lists the same way and never leak internals.
The API is used only by our own front end (ADR-0002), and the project is built by a very small
team that wants one deployable unit.

## Decision

We will implement the API as **Next.js route handlers validated with Zod**, with shared helpers in
`src/server/api`:

- `apiHandler` wraps every exported handler and turns thrown errors into responses.
- `ApiError` carries errors that are safe to show. Any other error becomes a generic `500`.
- Successful bodies are `{ data }`, lists are `{ data, pagination }` and errors are
  `{ error: { code, message, fields? } }`.
- Input is parsed with `parseJsonBody`, `parseSearchParams` and `parseWithSchema`. Failures are a
  `400` listing every invalid field.
- Lists use `page` and `pageSize` query parameters (default 20, maximum 100).
- Logging is structured JSON from `src/server/logger.ts`.
- `requireUser()` in `src/server/auth/require-user.ts` guards authenticated endpoints. It is a
  stub that always answers `401` until E3-01.

Handlers stay thin. Data access and business rules live in `src/server/<feature>`.

## Consequences

- Every endpoint behaves the same way, and new endpoints need very little boilerplate.
- The same Zod schemas can be reused by forms and Server Actions.
- Types are shared with the front end through the Zod schemas and response types, but there is no
  automatic end-to-end typing of calls, as tRPC would give.
- Contributors must wrap handlers in `apiHandler`, or errors will not be mapped. Reviews and the
  conventions in `docs/api-conventions.md` cover this.
- Database-specific errors (such as unique violations) are mapped to `ApiError` in the feature
  code that knows about them.

## Alternatives considered

- **tRPC:** end-to-end types, but it adds a second routing layer and a client runtime for an API
  with a single consumer, and plain HTTP endpoints are easier to test, export from and extend.
- **Server Actions only:** good for form mutations, but they are not a stable HTTP surface for
  reads, pagination or future clients.
- **Hand-written handlers without shared helpers:** no dependencies, but validation, errors and
  logging would drift between endpoints.
