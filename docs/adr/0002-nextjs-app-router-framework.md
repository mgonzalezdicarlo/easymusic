# ADR-0002: Use Next.js (App Router) with TypeScript as the framework

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

The product is a web application with authenticated pages, data-heavy dashboards and charts, and a
JSON API that only its own front end uses. It is built by a very small team that wants to deploy and
maintain a single unit. Mobile use matters, because people practice at the piano with a phone or
tablet nearby.

## Decision

We will build the application with **Next.js using the App Router**, **React 19** and
**TypeScript in strict mode**. Styling uses **Tailwind CSS** with **shadcn/ui** components. Server
logic lives in Route Handlers and Server Actions inside the same codebase.

## Consequences

- One repository and one deployable artifact, with end-to-end type safety between server and client.
- Server Components keep the initial JavaScript small, which helps on mobile.
- Straightforward hosting on Vercel, with preview deployments for pull requests.
- We follow Next.js release changes (Next.js 16 renamed `middleware` to `proxy`, for example), and
  some libraries lag behind the newest version.
- shadcn/ui components are copied into the repository (`src/components/ui`), so we own and maintain
  them but are not blocked by a library's release cycle.

## Alternatives considered

- **Vite + React SPA with a separate API (Express or NestJS):** two projects to build, deploy and
  keep in sync, with no real benefit for a first-party-only API.
- **Remix / React Router framework mode:** capable, but a smaller ecosystem and fewer hosting and
  tooling defaults for our needs.
- **SvelteKit:** excellent developer experience, but the team and the component ecosystem
  (shadcn/ui, Recharts) are React-based.
