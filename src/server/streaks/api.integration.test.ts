import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import * as streaksRoute from "@/app/api/streaks/route";
import { ApiError } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";
import { todayInTimezone, toDbDate } from "@/server/sessions/dates";
import type { StreakSummary } from "@/server/streaks/streaks";

// Tests choose who is signed in.
vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

type Data<T> = { data: T };

function asUser(id: string) {
  vi.mocked(requireUser).mockResolvedValue({ id });
}

async function getStreaks() {
  const response = await streaksRoute.GET(
    new Request("http://localhost/api/streaks"),
    undefined,
  );

  return {
    status: response.status,
    body: (await response.json()) as Data<StreakSummary>,
  };
}

// Users default to UTC, which has no daylight saving time, so subtracting whole days works.
const daysAgo = (days: number) =>
  todayInTimezone("UTC", new Date(Date.now() - days * 86_400_000));

function addSession(userId: string, date: string, durationMinutes = 30) {
  return prisma.practiceSession.create({
    data: { userId, date: toDbDate(date), durationMinutes },
  });
}

let alice: { id: string };
let bob: { id: string };

beforeEach(async () => {
  // Cascades to the users' sessions.
  await prisma.user.deleteMany();
  alice = await prisma.user.create({
    data: { email: "alice@example.test", name: "Alice" },
  });
  bob = await prisma.user.create({
    data: { email: "bob@example.test", name: "Bob" },
  });
  asUser(alice.id);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("streaks API", () => {
  it("answers 401 without a signed-in user", async () => {
    vi.mocked(requireUser).mockRejectedValue(ApiError.unauthorized());

    expect((await getStreaks()).status).toBe(401);
  });

  it("returns zeros for a user without sessions", async () => {
    const { status, body } = await getStreaks();

    expect(status).toBe(200);
    expect(body.data).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      totalActiveDays: 0,
      lastPracticeDate: null,
      practicedToday: false,
    });
  });

  it("calculates streaks from the user's sessions, several per day included", async () => {
    for (const offset of [0, 1, 1, 2, 5]) {
      await addSession(alice.id, daysAgo(offset));
    }

    const { body } = await getStreaks();

    expect(body.data).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      totalSessions: 5,
      totalActiveDays: 4,
      lastPracticeDate: daysAgo(0),
      practicedToday: true,
    });
  });

  it("does not count sessions with 0 minutes", async () => {
    await addSession(alice.id, daysAgo(0), 0);
    await addSession(alice.id, daysAgo(1), 20);

    const { body } = await getStreaks();

    expect(body.data).toMatchObject({
      currentStreak: 1,
      totalSessions: 1,
      practicedToday: false,
    });
  });

  it("ignores other users' sessions", async () => {
    await addSession(bob.id, daysAgo(0));
    await addSession(bob.id, daysAgo(1));

    expect((await getStreaks()).body.data.totalSessions).toBe(0);

    asUser(bob.id);

    expect((await getStreaks()).body.data.currentStreak).toBe(2);
  });

  it("uses the timezone stored for the user to decide what today is", async () => {
    // UTC+14 and UTC-11 are 25 hours apart, so the east date is always the later one.
    const westToday = todayInTimezone("Pacific/Pago_Pago");

    await addSession(alice.id, westToday);

    await prisma.user.update({
      where: { id: alice.id },
      data: { timezone: "Pacific/Pago_Pago" },
    });
    expect((await getStreaks()).body.data.practicedToday).toBe(true);

    await prisma.user.update({
      where: { id: alice.id },
      data: { timezone: "Pacific/Kiritimati" },
    });
    expect((await getStreaks()).body.data).toMatchObject({
      practicedToday: false,
      lastPracticeDate: westToday,
    });
  });
});
