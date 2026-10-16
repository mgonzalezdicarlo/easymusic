# ADR-0004: Use Better Auth for authentication

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

Users need to sign up, sign in with email and password or an OAuth provider (Google or GitHub), and
stay signed in across visits. User data must be strictly isolated per account. The first plan was
Auth.js (NextAuth). Since September 2025, Auth.js has been maintained by the Better Auth team in
security-patch-only mode, and its maintainers recommend Better Auth for new projects.

## Decision

We will use **Better Auth**, self-hosted in the Next.js application, with its **Prisma adapter** so
that users, sessions and accounts live in our own PostgreSQL database. Passwords are hashed by the
library, and rate limiting is enabled on credential endpoints. Route protection is implemented with
the Next.js 16 `proxy` convention plus a server-side session check in every data access path.

## Consequences

- Actively developed, with a plugin system (two-factor, organizations) available if needed later.
- All identity data stays in our database, with no per-user pricing or vendor lock-in.
- Better Auth adds its own tables (user, session, account, verification), which are generated into
  the Prisma schema in Epic 3 and merged with our own `User` fields.
- A younger library than Auth.js, so we pin versions and cover sign-up, sign-in and sign-out with
  E2E tests.
- Authorization (a user can only read and write their own data) remains our responsibility and is
  tested separately in the API integration tests.

## Alternatives considered

- **Auth.js (NextAuth v5):** works, but is in maintenance mode, and its documented middleware
  pattern predates the Next.js 16 `proxy` rename.
- **Clerk:** fastest to ship, but a hosted service with per-user pricing and user data held
  outside our database.
- **Supabase Auth:** sensible only if we adopted the whole Supabase platform.
- **Lucia:** deprecated and no longer a maintained library.
