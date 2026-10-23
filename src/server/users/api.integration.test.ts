import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import * as meRoute from "@/app/api/me/route";
import * as sessionsRoute from "@/app/api/sessions/route";
import { ApiError } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";
import { todayInTimezone } from "@/server/sessions/dates";

// Tests choose who is signed in.
vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

type Profile = {
  name: string;
  email: string;
  timezone: string;
  dailyGoalMinutes: number;
  onboarded: boolean;
};
type Data<T> = { data: T };
type ErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: { path: string; message: string }[];
  };
};

function asUser(id: string) {
  vi.mocked(requireUser).mockResolvedValue({ id });
}

function request(method: string, path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function read<T>(pending: Response | Promise<Response>) {
  const response = await pending;
  const text = await response.text();

  return {
    status: response.status,
    body: (text ? JSON.parse(text) : null) as T,
  };
}

const getMe = () => meRoute.GET(request("GET", "/api/me"), undefined);
const patchMe = (body: unknown) =>
  meRoute.PATCH(request("PATCH", "/api/me", body), undefined);
const deleteMe = (query = "") =>
  meRoute.DELETE(request("DELETE", `/api/me${query}`), undefined);
const createSession = (body: unknown) =>
  sessionsRoute.POST(request("POST", "/api/sessions", body), undefined);

let alice: { id: string; email: string };
let bob: { id: string; email: string };

beforeEach(async () => {
  // Cascades to everything the users own.
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();
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

describe("profile API", () => {
  it("answers 401 without a signed-in user", async () => {
    vi.mocked(requireUser).mockRejectedValue(ApiError.unauthorized());

    expect((await getMe()).status).toBe(401);
    expect((await patchMe({ name: "x" })).status).toBe(401);
    expect((await deleteMe("?confirm=true")).status).toBe(401);
  });

  it("returns the profile without internal fields", async () => {
    const result = await read<Data<Profile>>(getMe());

    expect(result.status).toBe(200);
    expect(result.body.data).toEqual({
      name: "Alice",
      email: "alice@example.test",
      timezone: "UTC",
      dailyGoalMinutes: 30,
      onboarded: false,
    });
  });

  it("updates the profile and trims the name", async () => {
    const result = await read<Data<Profile>>(
      patchMe({
        name: "  Alicia ",
        timezone: "America/Argentina/Buenos_Aires",
        dailyGoalMinutes: 45,
      }),
    );

    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({
      name: "Alicia",
      timezone: "America/Argentina/Buenos_Aires",
      dailyGoalMinutes: 45,
      onboarded: false,
    });

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: alice.id },
    });

    expect(row).toMatchObject({ name: "Alicia", dailyGoalMinutes: 45 });
  });

  it("marks onboarding as complete", async () => {
    const result = await read<Data<Profile>>(
      patchMe({
        timezone: "Europe/Madrid",
        dailyGoalMinutes: 20,
        completeOnboarding: true,
      }),
    );

    expect(result.body.data).toMatchObject({
      timezone: "Europe/Madrid",
      onboarded: true,
    });
  });

  it.each([
    [{ timezone: "Mars/Olympus" }, "timezone"],
    [{ dailyGoalMinutes: 0 }, "dailyGoalMinutes"],
    [{ dailyGoalMinutes: 1441 }, "dailyGoalMinutes"],
    [{ dailyGoalMinutes: 1.5 }, "dailyGoalMinutes"],
    [{ name: "   " }, "name"],
    [{ completeOnboarding: false }, "completeOnboarding"],
  ])("rejects invalid input %j", async (body, path) => {
    const result = await read<ErrorBody>(patchMe(body));

    expect(result.status).toBe(400);
    expect(result.body.error.fields).toEqual(
      expect.arrayContaining([{ path, message: expect.any(String) }]),
    );
  });

  it("rejects empty updates and unknown fields", async () => {
    expect((await patchMe({})).status).toBe(400);
    expect((await patchMe({ email: "x@example.test" })).status).toBe(400);
    expect((await patchMe({ id: "other" })).status).toBe(400);
  });

  it("applies a changed timezone to later 'today' checks", async () => {
    // UTC+14 and UTC-11 are 25 hours apart, so the east date is always the later one.
    const eastToday = todayInTimezone("Pacific/Kiritimati");

    await patchMe({ timezone: "Pacific/Pago_Pago" });

    const rejected = await read<ErrorBody>(
      createSession({ date: eastToday, durationMinutes: 10 }),
    );

    expect(rejected.status).toBe(400);

    await patchMe({ timezone: "Pacific/Kiritimati" });

    expect(
      (await createSession({ date: eastToday, durationMinutes: 10 })).status,
    ).toBe(201);
  });
});

describe("account deletion", () => {
  async function seedData(userId: string, email: string) {
    const scale = await prisma.scale.upsert({
      where: { tonic_mode: { tonic: "C", mode: "MAJOR" } },
      update: {},
      create: { tonic: "C", mode: "MAJOR" },
    });
    const session = await prisma.practiceSession.create({
      data: {
        userId,
        date: new Date("2026-01-15T00:00:00.000Z"),
        durationMinutes: 10,
      },
    });
    const userScale = await prisma.userScale.create({
      data: {
        userId,
        scaleId: scale.id,
        octaves: 2,
        handsMode: "TOGETHER",
        targetBpm: 120,
      },
    });

    await prisma.scalePracticeEntry.create({
      data: {
        userScaleId: userScale.id,
        sessionId: session.id,
        cleanBpm: 80,
        maxBpm: 90,
        durationMinutes: 10,
      },
    });

    const exercise = await prisma.exercise.create({
      data: { source: "CUSTOM", title: `Drill ${email}`, ownerId: userId },
    });
    const userExercise = await prisma.userExercise.create({
      data: { userId, exerciseId: exercise.id, targetBpm: 100 },
    });

    await prisma.exercisePracticeEntry.create({
      data: {
        userExerciseId: userExercise.id,
        sessionId: session.id,
        cleanBpm: 60,
        maxBpm: 70,
        durationMinutes: 5,
      },
    });
    await prisma.session.create({
      data: {
        userId,
        token: `token-${userId}`,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    await prisma.account.create({
      data: {
        userId,
        accountId: userId,
        providerId: "credential",
        password: "hash",
      },
    });
    await prisma.verification.create({
      data: {
        identifier: email,
        value: "code",
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
  }

  it("requires explicit confirmation", async () => {
    const missing = await read<ErrorBody>(deleteMe());

    expect(missing.status).toBe(400);
    expect(missing.body.error.fields).toEqual([
      { path: "confirm", message: expect.any(String) },
    ]);
    expect((await deleteMe("?confirm=yes")).status).toBe(400);
    expect(await prisma.user.count({ where: { id: alice.id } })).toBe(1);
  });

  it("removes all of the user's data and nothing else", async () => {
    await seedData(alice.id, alice.email);
    await seedData(bob.id, bob.email);

    expect((await deleteMe("?confirm=true")).status).toBe(204);

    expect(await prisma.user.count({ where: { id: alice.id } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: alice.id } })).toBe(0);
    expect(await prisma.account.count({ where: { userId: alice.id } })).toBe(0);
    expect(
      await prisma.verification.count({ where: { identifier: alice.email } }),
    ).toBe(0);
    expect(
      await prisma.practiceSession.count({ where: { userId: alice.id } }),
    ).toBe(0);
    expect(await prisma.userScale.count({ where: { userId: alice.id } })).toBe(
      0,
    );
    expect(
      await prisma.userExercise.count({ where: { userId: alice.id } }),
    ).toBe(0);
    expect(await prisma.exercise.count({ where: { ownerId: alice.id } })).toBe(
      0,
    );

    // Only Bob's rows are left.
    expect(await prisma.practiceSession.count()).toBe(1);
    expect(await prisma.scalePracticeEntry.count()).toBe(1);
    expect(await prisma.exercisePracticeEntry.count()).toBe(1);
    expect(await prisma.exercise.count({ where: { ownerId: bob.id } })).toBe(1);
    expect(await prisma.session.count({ where: { userId: bob.id } })).toBe(1);
    expect(
      await prisma.verification.count({ where: { identifier: bob.email } }),
    ).toBe(1);

    // The deleted user's session no longer resolves to a profile.
    expect((await getMe()).status).toBe(401);
  });
});

