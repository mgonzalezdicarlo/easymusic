# ADR-0005: Use Recharts for analytics charts

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

Analytics needs line charts (clean, max and target BPM over time) and pie or bar charts (practice
time distribution). Charts must be responsive, theme-aware (light and dark), accessible and quick to
build in React. The GitHub-style activity heat map is a different shape of problem: a calendar grid,
not an axis-based chart.

## Decision

We will use **Recharts** for line, bar and pie charts, styled with the design tokens defined in
`globals.css` (`--chart-1` to `--chart-5`). The activity heat map is a **custom component** built
with plain HTML and CSS grid, because no chart library models it well and a custom grid gives full
control over accessibility and keyboard navigation.

## Consequences

- Declarative, React-native API with responsive containers, tooltips and legends out of the box.
- Matches the chart components that shadcn/ui builds on, so styling stays consistent.
- SVG output scales well but is not suited to tens of thousands of points. Server-side aggregation
  (Epic 6) keeps datasets small.
- Accessibility is not automatic. Each chart gets accessible labels and a data-table fallback.
- Chart components are client components and will be lazy-loaded to protect the initial bundle.

## Alternatives considered

- **Chart.js with react-chartjs-2:** canvas-based and fast for large data, but harder to theme and
  to make accessible.
- **Nivo / visx / D3 directly:** more power and flexibility than we need, at a higher build and
  maintenance cost.
- **Tremor:** quick dashboards, but another UI layer on top of shadcn/ui and Tailwind.
