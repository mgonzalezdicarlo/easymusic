import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import * as scalePracticeRoute from "@/app/api/scale-practice/route";
import { ApiError } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { getActivityDays } from "@/server/dashboard/activity";
import { prisma } from "@/server/db";
import { todayInTimezone, toDbDate } from "@/server/sessions/dates";
import { getStreakSummary } from "@/server/streaks/service";

// Tests choose who is signed in.
vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

type Result = {
  sessionId: string;
  createdSession: boolean;
  sessionDurationMinutes: number;
  entries: { id: string; sessionId: string }[];
};
type ErrorBody = {
  error: { code: string; fields?: { path: string; message: string }[] };
};

// Users default to UTC.
const today = () => todayInTimezone("UTC");

async function log(entries: unknown[]) {
  const response = await scalePracticeRoute.POST(
    new Request("http://localhost/api/scale-practice", {
      method: "POST",
      body: JSON.stringify({ entries }),
    }),
    undefined,
  );

  return { status: response.status, body: (await response.json()) as never };
}

const entry = (userScaleId: string, extra: object = {}) => ({
  userScaleId,
  cleanBpm: 80,
  maxBpm: 96,
  durationMinutes: 10,
  ...extra,
});

async function seedWorld() {
  const alice = await prisma.user.create({
    data: { email: "alice@example.test", name: "Alice" },
  });
  const bob = await prisma.user.create({
    data: { email: "bob@example.test", name: "Bob" },
  });
  const scale = await prisma.scale.upsert({
    where: { tonic_mode: { tonic: "C", mode: "MAJOR" } },
    update: {},
    create: { tonic: "C", mode: "MAJOR" },
  });
  const track = (userId: string, octaves: number) =>
    prisma.userScale.create({
      data: {
        userId,
        scaleId: scale.id,
        octaves,
        handsMode: "TOGETHER",
        targetBpm: 120,
      },
    });

  return {
    alice,
    bob,
    a2: await track(alice.id, 2),
    a4: await track(alice.id, 4),
    b2: await track(bob.id, 2),
  };
}

let w: Awaited<ReturnType<typeof seedWorld>>;

const sessionCount = () =>
  prisma.practiceSession.count({ where: { userId: w.alice.id } });

beforeEach(async () => {
  // Cascades to sessions, tracked scales and entries. The shared scale catalog is kept.
  await prisma.user.deleteMany();
  w = await seedWorld();
  vi.mocked(requireUser).mockResolvedValue({ id: w.alice.id });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/scale-practice", () => {
  it("answers 401 without a signed-in user", async () => {
    vi.mocked(requireUser).mockRejectedValue(ApiError.unauthorized());

    expect((await log([entry(w.a2.id)])).status).toBe(401);
  });

  it("creates today's session and makes the day count for the heat map and streak", async () => {
    const { status, body } = (await log([
      entry(w.a2.id),
      entry(w.a4.id, { durationMinutes: 15 }),
    ])) as { status: number; body: { data: Result } };

    expect(status).toBe(201);
    expect(body.data).toMatchObject({
      createdSession: true,
      sessionDurationMinutes: 25,
    });
    expect(body.data.entries).toHaveLength(2);

    const { days } = await getActivityDays(w.alice.id);
    const streaks = await getStreakSummary(w.alice.id);

    expect(days[today()]).toBe(25);
    expect(streaks).toMatchObject({ currentStreak: 1, practicedToday: true });
  });

  it("adds to today's session when it already has entries", async () => {
    await log([entry(w.a2.id)]);

    const { body } = (await log([entry(w.a4.id, { durationMinutes: 5 })])) as {
      body: { data: Result };
    };

    expect(body.data).toMatchObject({
      createdSession: false,
      sessionDurationMinutes: 15,
    });
    expect(await sessionCount()).toBe(1);
  });

  it("uses an empty 0-minute session", async () => {
    const shell = await prisma.practiceSession.create({
      data: { userId: w.alice.id, date: toDbDate(today()), durationMinutes: 0 },
    });
    const { body } = (await log([entry(w.a2.id)])) as {
      body: { data: Result };
    };

    expect(body.data).toMatchObject({
      sessionId: shell.id,
      createdSession: false,
    });
    expect(await sessionCount()).toBe(1);
  });

  it("leaves a session with a manual duration alone and creates a new one", async () => {
    const manual = await prisma.practiceSession.create({
      data: {
        userId: w.alice.id,
        date: toDbDate(today()),
        durationMinutes: 30,
      },
    });
    const { body } = (await log([entry(w.a2.id)])) as {
      body: { data: Result };
    };

    expect(body.data.createdSession).toBe(true);
    expect(body.data.sessionId).not.toBe(manual.id);
    expect(await sessionCount()).toBe(2);
    expect(
      (
        await prisma.practiceSession.findUniqueOrThrow({
          where: { id: manual.id },
        })
      ).durationMinutes,
    ).toBe(30);
  });

  it.each([
    [entry("x", { cleanBpm: 100, maxBpm: 90 }), "entries.0.maxBpm"],
    [entry("x", { cleanBpm: 19 }), "entries.0.cleanBpm"],
    [entry("x", { durationMinutes: 0 }), "entries.0.durationMinutes"],
  ])("rejects invalid input %j", async (invalid, path) => {
    const { status, body } = (await log([invalid])) as {
      status: number;
      body: ErrorBody;
    };

    expect(status).toBe(400);
    expect(body.error.fields).toEqual(
      expect.arrayContaining([{ path, message: expect.any(String) }]),
    );
    expect(await sessionCount()).toBe(0);
  });

  it("rejects an empty list and unknown fields", async () => {
    expect((await log([])).status).toBe(400);
    expect((await log([entry(w.a2.id, { sessionId: "x" })])).status).toBe(400);
  });

  it("answers 404 for another user's setup and saves nothing", async () => {
    expect((await log([entry(w.a2.id), entry(w.b2.id)])).status).toBe(404);
    expect(await sessionCount()).toBe(0);
    expect(await prisma.scalePracticeEntry.count()).toBe(0);
  });

  it("answers 409 for an archived setup", async () => {
    await prisma.userScale.update({
      where: { id: w.a2.id },
      data: { status: "ARCHIVED" },
    });

    expect((await log([entry(w.a2.id)])).status).toBe(409);
    expect(await sessionCount()).toBe(0);
  });

  it("rolls back, new session included, when the entries add up to more than a day", async () => {
    const { status, body } = (await log([
      entry(w.a2.id, { durationMinutes: 1000 }),
      entry(w.a4.id, { durationMinutes: 500 }),
    ])) as { status: number; body: ErrorBody };

    expect(status).toBe(400);
    expect(body.error.fields).toEqual([
      { path: "durationMinutes", message: expect.any(String) },
    ]);
    expect(await sessionCount()).toBe(0);
    expect(await prisma.scalePracticeEntry.count()).toBe(0);
  });
});
