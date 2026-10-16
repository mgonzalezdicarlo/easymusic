# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

The project is built step by step from a roadmap of GitHub issues. Technology choices made early
(framework, database, authentication) shape everything that follows, and their reasoning is easily
forgotten or lost in chat history and pull requests.

## Decision

We will record significant architectural decisions as Architecture Decision Records in `docs/adr`,
using the lightweight template in `docs/adr/template.md`. ADRs are numbered, immutable once accepted,
and superseded rather than edited.

## Consequences

- New contributors can learn why the project is built the way it is, not only how.
- Changing a decision requires a short written justification, which discourages churn.
- A small documentation cost is added to decisions that are expensive to reverse.

## Alternatives considered

- **Wiki or chat history:** drifts out of sync with the code and is hard to search.
- **No records:** zero cost now, but decisions are re-litigated and context is lost.
