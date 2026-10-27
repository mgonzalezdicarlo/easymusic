import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardEmptyState } from "@/features/dashboard/empty-state";
import { StatCards } from "@/features/dashboard/stat-cards";
import { WeeklyGoalCard } from "@/features/dashboard/weekly-goal-card";

describe("StatCards", () => {
  const base = {
    currentStreak: 3,
    longestStreak: 12,
    practicedToday: true,
    minutesThisWeek: 75,
    sessionsThisMonth: 9,
  };

  it("shows the four statistics", () => {
    render(<StatCards {...base} />);

    expect(screen.getByText("Current streak")).toBeInTheDocument();
    expect(screen.getByText("3 days")).toBeInTheDocument();
    expect(screen.getByText("12 days")).toBeInTheDocument();
    expect(screen.getByText("1 h 15 min")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Practiced today.")).toBeInTheDocument();
  });

  it("uses the singular for one day", () => {
    render(<StatCards {...base} currentStreak={1} longestStreak={1} />);

    expect(screen.getAllByText("1 day")).toHaveLength(2);
  });

  it("nudges the user to keep an alive streak going", () => {
    render(<StatCards {...base} practicedToday={false} />);

    expect(
      screen.getByText("Practice today to keep it going."),
    ).toBeInTheDocument();
  });

  it("nudges the user to start a new streak when there is none", () => {
    render(<StatCards {...base} currentStreak={0} practicedToday={false} />);

    expect(
      screen.getByText("Practice today to start a new streak."),
    ).toBeInTheDocument();
  });
});

describe("WeeklyGoalCard", () => {
  it("shows the progress and what is left", () => {
    render(
      <WeeklyGoalCard
        goal={{ goalMinutes: 210, minutes: 60, percent: 28, reached: false }}
        action={<button type="button">Log practice</button>}
      />,
    );

    expect(screen.getByText("1 h of 3 h 30 min")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "28",
    );
    expect(screen.getByText("2 h 30 min to go this week.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Log practice" }),
    ).toBeInTheDocument();
  });

  it("celebrates a reached goal", () => {
    render(
      <WeeklyGoalCard
        goal={{ goalMinutes: 210, minutes: 250, percent: 100, reached: true }}
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(
      screen.getByText("Goal reached. Great work this week!"),
    ).toBeInTheDocument();
  });
});

describe("DashboardEmptyState", () => {
  it("points a new user to logging their first session", () => {
    render(
      <DashboardEmptyState
        action={<button type="button">Log practice</button>}
      />,
    );

    expect(screen.getByText("Start your practice streak")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Log practice" }),
    ).toBeInTheDocument();
  });
});
