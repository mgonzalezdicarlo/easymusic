import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getDashboardSummary } from "@/server/dashboard/service";
import { prisma } from "@/server/db";
import { toDbDate } from "@/server/sessions/dates";
import { getStreakSummary } from "@/server/streaks/service";

// Wednesday. Its week runs from Monday 2026-10-26. Users default to the UTC timezone.
const now = new Date("2026-10-28T12:00:00Z");

let alice: { id: string };
let bob: { id: string };

function addSession(userId: string, date: string, durationMinutes: number) {
  return prisma.practiceSession.create({
    data: { userId, date: toDbDate(date), durationMinutes },
  });
}

beforeEach(async () => {
  // Cascades to the users' sessions.
  await prisma.user.deleteMany();
  alice = await prisma.user.create({
    data: { email: "alice@example.test", name: "Alice", dailyGoalMinutes: 30 },
  });
  bob = await prisma.user.create({
    data: { email: "bob@example.test", name: "Bob" },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("getDashboardSummary", () => {
  it("returns zeros for a user without sessions", async () => {
    const summary = await getDashboardSummary(alice.id, now);

    expect(summary.minutesThisWeek).toBe(0);
    expect(summary.sessionsThisMonth).toBe(0);
    expect(summary.streaks.totalSessions).toBe(0);
    expect(summary.weeklyGoal).toEqual({
      goalMinutes: 210,
      minutes: 0,
      percent: 0,
      reached: false,
    });
  });

  it("counts this week and this month only, and matches the streak service", async () => {
    await addSession(alice.id, "2026-10-28", 30); // today
    await addSession(alice.id, "2026-10-27", 20);
    await addSession(alice.id, "2026-10-26", 10); // Monday
    await addSession(alice.id, "2026-10-25", 45); // last week, same month
    await addSession(alice.id, "2026-10-01", 15); // this month only
    await addSession(alice.id, "2026-09-30", 60); // last month
    await addSession(alice.id, "2026-10-29", 40); // in the future: ignored
    await addSession(alice.id, "2026-10-28", 0); // empty shell: ignored
    await addSession(bob.id, "2026-10-28", 90); // another user: ignored

    const summary = await getDashboardSummary(alice.id, now);

    expect(summary.minutesThisWeek).toBe(60);
    expect(summary.sessionsThisMonth).toBe(5);
    expect(summary.weeklyGoal).toMatchObject({ minutes: 60, percent: 28 });
    expect(summary.streaks).toEqual(await getStreakSummary(alice.id, now));
    expect(summary.streaks).toMatchObject({
      currentStreak: 4,
      longestStreak: 4,
      totalSessions: 6,
    });
  });

  it("starts the week and month on the user's local calendar", async () => {
    // 02:30 UTC on Monday 2026-11-02 is still Sunday 2026-11-01 in Buenos Aires.
    await prisma.user.update({
      where: { id: alice.id },
      data: { timezone: "America/Argentina/Buenos_Aires" },
    });
    await addSession(alice.id, "2026-10-26", 10);
    await addSession(alice.id, "2026-11-01", 20);

    const summary = await getDashboardSummary(
      alice.id,
      new Date("2026-11-02T02:30:00Z"),
    );

    expect(summary.minutesThisWeek).toBe(30);
    expect(summary.sessionsThisMonth).toBe(1);
  });

  it("rejects an unknown user", async () => {
    await expect(getDashboardSummary("missing", now)).rejects.toMatchObject({
      status: 401,
    });
  });
});
