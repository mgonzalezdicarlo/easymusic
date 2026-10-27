import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getActivityDays } from "@/server/dashboard/activity";
import { prisma } from "@/server/db";
import { toDbDate } from "@/server/sessions/dates";

// Users default to the UTC timezone.
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
    data: { email: "alice@example.test", name: "Alice", dailyGoalMinutes: 45 },
  });
  bob = await prisma.user.create({
    data: { email: "bob@example.test", name: "Bob" },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("getActivityDays", () => {
  it("returns no days for a user without sessions", async () => {
    expect(await getActivityDays(alice.id, now)).toEqual({
      today: "2026-10-28",
      dailyGoalMinutes: 45,
      days: {},
    });
  });

  it("adds up sessions per day and leaves out empty, future and other users' sessions", async () => {
    await addSession(alice.id, "2026-10-28", 20);
    await addSession(alice.id, "2026-10-28", 15);
    await addSession(alice.id, "2026-01-15", 60);
    await addSession(alice.id, "2026-10-27", 0); // empty shell
    await addSession(alice.id, "2026-10-29", 30); // in the future
    await addSession(bob.id, "2026-10-28", 90);

    const { days } = await getActivityDays(alice.id, now);

    expect(days).toEqual({ "2026-10-28": 35, "2026-01-15": 60 });
  });

  it("decides what today is from the user's timezone", async () => {
    await prisma.user.update({
      where: { id: alice.id },
      data: { timezone: "America/Argentina/Buenos_Aires" },
    });
    await addSession(alice.id, "2026-11-02", 30);

    // 02:30 UTC on Nov 2 is still Nov 1 in Buenos Aires, so Nov 2 is in the future.
    const result = await getActivityDays(
      alice.id,
      new Date("2026-11-02T02:30:00Z"),
    );

    expect(result.today).toBe("2026-11-01");
    expect(result.days).toEqual({});
  });

  it("rejects an unknown user", async () => {
    await expect(getActivityDays("missing", now)).rejects.toMatchObject({
      status: 401,
    });
  });
});
