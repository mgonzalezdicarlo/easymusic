import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ActivityHeatmap } from "@/features/heatmap/activity-heatmap";
import type { HeatmapDay } from "@/features/heatmap/heatmap";
import { formatSessionDate } from "@/lib/practice-session";

const TODAY = "2026-10-24";
const MS_PER_DAY = 86_400_000;

/** `count` consecutive dates starting at `start`. */
function dates(start: string, count: number) {
  const first = Date.parse(`${start}T00:00:00Z`);

  return Array.from({ length: count }, (_, index) =>
    new Date(first + index * MS_PER_DAY).toISOString().slice(0, 10),
  );
}

function setup(days: HeatmapDay[] = []) {
  const user = userEvent.setup();
  const { container } = render(
    <ActivityHeatmap days={days} dailyGoalMinutes={30} today={TODAY} />,
  );
  const gridcells = () =>
    Array.from(container.querySelectorAll<HTMLElement>('[role="gridcell"]'));

  return { user, gridcells };
}

const cell = (date: string, text: string) =>
  screen.getByLabelText(`${formatSessionDate(date)}: ${text}`);

describe("ActivityHeatmap", () => {
  it("renders an empty grid with a friendly summary", () => {
    const { gridcells } = setup();

    expect(
      screen.getByRole("grid", { name: /practice activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No practice logged in the last 12 months."),
    ).toBeInTheDocument();
    expect(gridcells()).toHaveLength(365);
    expect(gridcells().every((el) => el.dataset.level === "0")).toBe(true);
  });

  it("labels each cell with its date and minutes and shades it by the goal", () => {
    setup([
      { date: "2026-01-15", minutes: 20 },
      { date: "2026-01-15", minutes: 25 },
      { date: "2026-02-02", minutes: 10 },
      { date: "2026-02-03", minutes: 20 },
      { date: "2026-02-04", minutes: 60 },
    ]);

    // Two sessions on the same day are added up.
    expect(cell("2026-01-15", "45 min").dataset.level).toBe("3");
    expect(cell("2026-02-02", "10 min").dataset.level).toBe("1");
    expect(cell("2026-02-03", "20 min").dataset.level).toBe("2");
    expect(cell("2026-02-04", "1 h").dataset.level).toBe("4");
    expect(cell("2026-02-05", "no practice").dataset.level).toBe("0");
    expect(
      screen.getByText("4 days practiced · 2 h 15 min in the last 12 months"),
    ).toBeInTheDocument();
  });

  it("renders a full year of practice", () => {
    const { gridcells } = setup(
      dates("2025-10-25", 365).map((date) => ({ date, minutes: 30 })),
    );

    expect(gridcells()).toHaveLength(365);
    expect(gridcells().every((el) => el.dataset.level === "3")).toBe(true);
    expect(
      screen.getByText(/365 days practiced · 182 h 30 min/),
    ).toBeInTheDocument();
  });

  it("shows month labels and a legend", () => {
    setup();

    expect(screen.getByText("Nov")).toBeInTheDocument();
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("shows the date and minutes in a tooltip on hover", async () => {
    const { user } = setup([{ date: "2026-01-15", minutes: 45 }]);
    const target = cell("2026-01-15", "45 min");
    const text = `${formatSessionDate("2026-01-15")} · 45 min`;

    await user.hover(target);
    expect(screen.getByText(text)).toBeInTheDocument();

    await user.unhover(target);
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });

  it("moves between days with the arrow keys using a roving tab stop", async () => {
    const { user } = setup([{ date: TODAY, minutes: 20 }]);
    const today = cell(TODAY, "20 min");

    expect(today).toHaveAttribute("tabindex", "0");

    act(() => today.focus());
    await user.keyboard("{ArrowLeft}");

    const lastWeek = cell("2026-10-17", "no practice");

    expect(lastWeek).toHaveFocus();
    expect(lastWeek).toHaveAttribute("tabindex", "0");
    expect(today).toHaveAttribute("tabindex", "-1");
    // The tooltip follows the keyboard focus.
    expect(
      screen.getByText(`${formatSessionDate("2026-10-17")} · no practice`),
    ).toBeInTheDocument();

    await user.keyboard("{ArrowUp}");
    expect(cell("2026-10-16", "no practice")).toHaveFocus();
  });

  it("stays on the cell when there is no day in that direction", async () => {
    const { user } = setup([{ date: TODAY, minutes: 20 }]);
    const today = cell(TODAY, "20 min");

    act(() => today.focus());
    await user.keyboard("{ArrowRight}{ArrowDown}");

    expect(today).toHaveFocus();
  });

  it("switches to a calendar year and hides days that have not happened yet", async () => {
    const { user, gridcells } = setup([
      { date: "2025-03-10", minutes: 30 },
      { date: "2026-02-02", minutes: 60 },
    ]);
    const select = screen.getByLabelText("Period");

    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Last 12 months", "2026", "2025"]);
    expect(
      screen.getByText("1 day practiced · 1 h in the last 12 months"),
    ).toBeInTheDocument();

    await user.selectOptions(select, "2025");

    expect(
      screen.getByText("1 day practiced · 30 min in 2025"),
    ).toBeInTheDocument();
    expect(gridcells()).toHaveLength(365);
    expect(cell("2025-03-10", "30 min").dataset.level).toBe("3");

    await user.selectOptions(select, "2026");

    // January 1 to October 24: the rest of the year is not focusable.
    expect(gridcells()).toHaveLength(297);
    expect(cell("2026-02-02", "1 h").dataset.level).toBe("4");
  });
});
