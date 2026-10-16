# ADR-0003: Use PostgreSQL with Prisma for data storage

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

The data is relational: users own practice sessions, which contain entries that reference catalog
scales and exercises. Correctness rules matter (BPM ranges, `maxBpm >= cleanBpm`, no duplicate
tracked scales), and the analytics features need grouping and time-bucketed aggregation over a
user's history.

## Decision

We will store data in **PostgreSQL** and access it through **Prisma** (schema, migrations and a typed
client). Local development uses PostgreSQL in Docker Compose. Production uses a managed PostgreSQL
instance with automated backups.

## Consequences

- Strong constraints, transactions and mature aggregation support for the analytics queries.
- Prisma gives a single schema file, reviewable migrations and typed queries.
- Prisma cannot declare `CHECK` constraints in its schema, so rules such as `maxBpm >= cleanBpm`
  are added in hand-written SQL inside migrations and also validated with Zod at the API boundary.
- Heavy aggregations may need `$queryRaw` with typed results.
- The client must be generated (`prisma generate`) in CI and on deploy.

## Alternatives considered

- **Drizzle ORM:** SQL-first and lightweight, but Prisma's migrations workflow and tooling are a
  better fit for a small team.
- **Supabase client directly:** couples the app to one vendor's API; we only want to use its
  PostgreSQL if hosting there.
- **SQLite:** simple locally, but weaker for concurrent production use and managed hosting.
- **MongoDB:** the data is relational and constraint-heavy, so a document store adds risk without
  benefit.
