import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ActivityHeatmap } from "@/features/dashboard/activity-heatmap";

const today = "2026-10-28"; // Wednesday
const days = {
  "2026-10-28": 30,
  "2026-10-27": 10,
  "2026-01-15": 60,
  "2025-06-01": 20,
};

function setup(data: Record<string, number> = days) {
  render(<ActivityHeatmap days={data} today={today} dailyGoalMinutes={30} />);

  return userEvent.setup();
}

const cell = (name: string | RegExp) => screen.getByRole("gridcell", { name });

describe("ActivityHeatmap", () => {
  it("labels every cell with its date and minutes", () => {
    setup();

    expect(cell("Wed, Oct 28, 2026: 30 min")).toBeInTheDocument();
    expect(cell("Thu, Jan 15, 2026: 1 h")).toBeInTheDocument();
    expect(cell("Mon, Oct 26, 2026: no practice")).toBeInTheDocument();
  });

  it("shades days by their share of the daily goal", () => {
    setup();

    expect(cell(/Oct 28, 2026/)).toHaveAttribute("data-level", "4");
    expect(cell(/Oct 27, 2026/)).toHaveAttribute("data-level", "2");
    expect(cell(/Oct 26, 2026/)).toHaveAttribute("data-level", "0");
  });

  it("summarizes the last 12 months", () => {
    setup();

    expect(screen.getByText("1 h 40 min practiced on 3 days.")).toBeVisible();
  });

  it("renders an empty grid without practice", () => {
    setup({});

    expect(
      screen.getByText("No practice logged in this period."),
    ).toBeInTheDocument();
    expect(cell("Wed, Oct 28, 2026: no practice")).toHaveAttribute(
      "data-level",
      "0",
    );
  });

  it("switches to a calendar year", async () => {
    const user = setup();

    await user.selectOptions(screen.getByLabelText("Period"), "2025");

    expect(screen.getByText("20 min practiced on 1 day.")).toBeInTheDocument();
    expect(cell(/Jun 1, 2025: 20 min/)).toBeInTheDocument();
    expect(
      screen.queryByRole("gridcell", { name: /Oct 28, 2026/ }),
    ).not.toBeInTheDocument();
  });

  it("has a single tab stop, on the latest day", () => {
    setup();

    const tabStops = screen
      .getAllByRole("gridcell")
      .filter((item) => item.tabIndex === 0);

    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toHaveAccessibleName(/Oct 28, 2026/);
  });

  it("moves between days with the arrow keys", async () => {
    const user = setup();

    await user.click(cell(/Oct 28, 2026/));
    await user.keyboard("{ArrowUp}");
    expect(cell(/Oct 27, 2026/)).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(cell(/Oct 20, 2026/)).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(cell(/Oct 21, 2026/)).toHaveFocus();
  });

  it("keeps the focus where it is when the next day is in the future", async () => {
    const user = setup();

    await user.click(cell(/Oct 28, 2026/));
    await user.keyboard("{ArrowDown}");

    expect(cell(/Oct 28, 2026/)).toHaveFocus();
  });

  it("shows the details of the selected day", async () => {
    const user = setup();

    expect(screen.getByText(/Hover, tap or focus a day/)).toBeInTheDocument();

    await user.click(cell(/Oct 27, 2026/));

    expect(screen.getByText("Tue, Oct 27, 2026: 10 min")).toBeInTheDocument();
  });
});
