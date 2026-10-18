# Architecture Decision Records

An ADR is a short document that captures one significant technical decision: the context, the
choice, and its consequences. Together they explain _why_ the project looks the way it does.

## Index

| ADR                                             | Title                                                     | Status   |
| ----------------------------------------------- | --------------------------------------------------------- | -------- |
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions                             | Accepted |
| [0002](./0002-nextjs-app-router-framework.md)   | Use Next.js (App Router) with TypeScript as the framework | Accepted |
| [0003](./0003-postgresql-and-prisma.md)         | Use PostgreSQL with Prisma for data storage               | Accepted |
| [0004](./0004-better-auth-authentication.md)    | Use Better Auth for authentication                        | Accepted |
| [0005](./0005-recharts-for-charts.md)           | Use Recharts for analytics charts                         | Accepted |
| [0006](./0006-practice-session-date-storage.md) | Store practice session dates as local calendar dates      | Proposed |
| [0007](./0007-route-handlers-and-zod-api.md)    | Use route handlers with Zod for the backend API           | Proposed |

## When to write one

Write an ADR when a decision is expensive to reverse or affects several features: a new framework or
library, a data-modelling rule, how dates are stored, how errors are handled. Small, local choices do
not need one.

## How to write one

1. Copy [`template.md`](./template.md) to `NNNN-short-title.md` using the next free number.
2. Fill it in and set the status to **Proposed**.
3. Add it to the index above and open a pull request. Set it to **Accepted** when it merges.
4. Never rewrite an accepted ADR. To change a decision, write a new ADR and mark the old one
   **Superseded by ADR-NNNN**.
