# Activity heat map

How the dashboard heat map works (E3-05). The grid rules are in `src/lib/heatmap.ts` (pure, no
React or server imports), the data in `src/server/dashboard/activity.ts` and the component in
`src/features/dashboard/activity-heatmap.tsx`.

## Data

`getActivityDays` returns the user's today, daily goal and the minutes practiced per day. Several
sessions on one day are added up. Like the streak service, it ignores sessions with 0 minutes and
dates later than today in the user's timezone (ADR-0006). The page passes this to the client
component, which builds the grid, so changing the period needs no request.

## Rules

1. Columns are weeks, Monday to Sunday. Days before the period starts or after today are empty
   padding, not cells.
2. "Last 12 months" shows the last 52 weeks, ending with the current week. A calendar year shows
   January 1 to December 31, or to today for the current year. The year list starts at the first
   year with practice.
3. Intensity is relative to the daily goal: level 0 is no practice, 1 is under 25 % of the goal,
   2 under 50 %, 3 under 100 % and 4 reaches it. Changing the goal in Settings changes the shades.
4. A month label is placed on the first column that starts in that month.

## Accessibility

- The grid has `grid`, `row` and `gridcell` roles. Each cell is named "Thu, Jan 15, 2026: 1 h" or
  "...: no practice".
- One cell is a tab stop. The arrow keys move between days, and left and right change the week.
- Hovering shows the label as a tooltip. Hover, focus and tap also show it below the grid.
- Colors come from the theme tokens, so both themes work. The legend and month labels are hidden
  from screen readers because every cell carries its own label.
- On small screens the grid scrolls sideways inside its card.
