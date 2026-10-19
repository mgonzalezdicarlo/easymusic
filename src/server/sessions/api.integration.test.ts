import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import * as exerciseEntryRoute from "@/app/api/sessions/[sessionId]/exercise-entries/[entryId]/route";
import * as exerciseEntriesRoute from "@/app/api/sessions/[sessionId]/exercise-entries/route";
import * as sessionRoute from "@/app/api/sessions/[sessionId]/route";
import * as scaleEntryRoute from "@/app/api/sessions/[sessionId]/scale-entries/[entryId]/route";
import * as scaleEntriesRoute from "@/app/api/sessions/[sessionId]/scale-entries/route";
import * as sessionsRoute from "@/app/api/sessions/route";
import { ApiError } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";
import { todayInTimezone } from "@/server/sessions/dates";

// E3-01 replaces the real requireUser. Tests choose who is signed in.
vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

type Entry = {
  id: string;
  cleanBpm: number;
  maxBpm: number;
  durationMinutes: number;
  notes: string | null;
};
type Session = {
  id: string;
  date: string;
  durationMinutes: number;
  notes: string | null;
  scaleEntries: Entry[];
  exerciseEntries: Entry[];
};
type Data<T> = { data: T };
type EntryResult = { entry: Entry; sessionDurationMinutes: number };
type ListBody = {
  data: Session[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
type ErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: { path: string; message: string }[];
  };
};

const entryRoutes = {
  scale: { collection: scaleEntriesRoute, item: scaleEntryRoute },
  exercise: { collection: exerciseEntriesRoute, item: exerciseEntryRoute },
};
const segments = { scale: "scale-entries", exercise: "exercise-entries" };
type Kind = keyof typeof entryRoutes;

function asUser(id: string) {
  vi.mocked(requireUser).mockResolvedValue({ id });
}

function jsonRequest(method: string, path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const routeContext = <T extends Record<string, string>>(value: T) => ({
  params: Promise.resolve(value),
});

async function read<T>(pending: Response | Promise<Response>) {
  const response = await pending;

  return { status: response.status, body: (await response.json()) as T };
}

const createSession = (body: unknown) =>
  sessionsRoute.POST(jsonRequest("POST", "/api/sessions", body), undefined);
const listSessions = (query = "") =>
  sessionsRoute.GET(jsonRequest("GET", `/api/sessions${query}`), undefined);
const getSession = (id: string) =>
  sessionRoute.GET(
    jsonRequest("GET", `/api/sessions/${id}`),
    routeContext({ sessionId: id }),
  );
const patchSession = (id: string, body: unknown) =>
  sessionRoute.PATCH(
    jsonRequest("PATCH", `/api/sessions/${id}`, body),
    routeContext({ sessionId: id }),
  );
const deleteSession = (id: string) =>
  sessionRoute.DELETE(
    jsonRequest("DELETE", `/api/sessions/${id}`),
    routeContext({ sessionId: id }),
  );

const addEntry = (kind: Kind, sessionId: string, body: unknown) =>
  entryRoutes[kind].collection.POST(
    jsonRequest("POST", `/api/sessions/${sessionId}/${segments[kind]}`, body),
    routeContext({ sessionId }),
  );
const patchEntry = (
  kind: Kind,
  sessionId: string,
  entryId: string,
  body: unknown,
) =>
  entryRoutes[kind].item.PATCH(
    jsonRequest(
      "PATCH",
      `/api/sessions/${sessionId}/${segments[kind]}/${entryId}`,
      body,
    ),
    routeContext({ sessionId, entryId }),
  );
const deleteEntry = (kind: Kind, sessionId: string, entryId: string) =>
  entryRoutes[kind].item.DELETE(
    jsonRequest(
      "DELETE",
      `/api/sessions/${sessionId}/${segments[kind]}/${entryId}`,
    ),
    routeContext({ sessionId, entryId }),
  );

const sessionBody = (extra: object = {}) => ({
  date: "2026-01-15",
  durationMinutes: 30,
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
  const trackScale = (userId: string) =>
    prisma.userScale.create({
      data: {
        userId,
        scaleId: scale.id,
        octaves: 2,
        handsMode: "TOGETHER",
        targetBpm: 120,
      },
    });
  const aliceExercise = await prisma.exercise.create({
    data: { source: "CUSTOM", title: "Alice drill", ownerId: alice.id },
  });

  return {
    alice,
    bob,
    aliceScale: await trackScale(alice.id),
    bobScale: await trackScale(bob.id),
    aliceExercise,
    aliceUserExercise: await prisma.userExercise.create({
      data: { userId: alice.id, exerciseId: aliceExercise.id, targetBpm: 100 },
    }),
  };
}

let w: Awaited<ReturnType<typeof seedWorld>>;

const scaleBody = (extra: object = {}) => ({
  userScaleId: w.aliceScale.id,
  cleanBpm: 80,
  maxBpm: 96,
  durationMinutes: 10,
  ...extra,
});
const exerciseBody = (extra: object = {}) => ({
  userExerciseId: w.aliceUserExercise.id,
  cleanBpm: 60,
  maxBpm: 70,
  durationMinutes: 15,
  ...extra,
});

async function newSession(durationMinutes = 0) {
  const { body } = await read<Data<Session>>(
    createSession(sessionBody({ durationMinutes })),
  );

  return body.data.id;
}

beforeEach(async () => {
  // Cascades to sessions, tracked items, custom exercises and entries. The shared scale
  // catalog is kept.
  await prisma.user.deleteMany();
  w = await seedWorld();
  asUser(w.alice.id);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("practice sessions API", () => {
  it("answers 401 without a signed-in user", async () => {
    vi.mocked(requireUser).mockRejectedValue(ApiError.unauthorized());

    expect((await listSessions()).status).toBe(401);
    expect((await createSession(sessionBody())).status).toBe(401);
  });

  it("creates, reads, updates and deletes a session", async () => {
    const created = await read<Data<Session>>(
      createSession(sessionBody({ notes: "  Warm-up  " })),
    );

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      date: "2026-01-15",
      durationMinutes: 30,
      notes: "Warm-up",
      scaleEntries: [],
      exerciseEntries: [],
    });

    const id = created.body.data.id;
    const fetched = await read<Data<Session>>(getSession(id));

    expect(fetched.body.data.id).toBe(id);

    const updated = await read<Data<Session>>(
      patchSession(id, { durationMinutes: 45, notes: null }),
    );

    expect(updated.body.data).toMatchObject({
      durationMinutes: 45,
      notes: null,
    });
    expect((await deleteSession(id)).status).toBe(204);
    expect((await getSession(id)).status).toBe(404);
  });

  it("filters by date range, lists newest first and paginates", async () => {
    for (const date of [
      "2026-01-10",
      "2026-01-15",
      "2026-01-20",
      "2026-02-01",
    ]) {
      await createSession(sessionBody({ date }));
    }

    const range = await read<ListBody>(
      listSessions("?from=2026-01-15&to=2026-01-31"),
    );

    expect(range.body.data.map((s) => s.date)).toEqual([
      "2026-01-20",
      "2026-01-15",
    ]);
    expect(range.body.pagination.total).toBe(2);

    const page = await read<ListBody>(listSessions("?pageSize=2&page=2"));

    expect(page.body.data.map((s) => s.date)).toEqual([
      "2026-01-15",
      "2026-01-10",
    ]);
    expect(page.body.pagination).toMatchObject({ total: 4, totalPages: 2 });
  });

  it.each([
    [sessionBody({ date: "2999-01-01" }), "date"],
    [sessionBody({ date: "2026-02-30" }), "date"],
    [sessionBody({ date: "15/01/2026" }), "date"],
    [sessionBody({ durationMinutes: 1441 }), "durationMinutes"],
    [sessionBody({ durationMinutes: 1.5 }), "durationMinutes"],
  ])("rejects invalid input %j", async (body, path) => {
    const result = await read<ErrorBody>(createSession(body));

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("VALIDATION_ERROR");
    expect(result.body.error.fields).toEqual(
      expect.arrayContaining([{ path, message: expect.any(String) }]),
    );
  });

  it("rejects unknown fields, empty updates and inverted ranges", async () => {
    const id = await newSession();

    expect((await createSession(sessionBody({ userId: "x" }))).status).toBe(
      400,
    );
    expect((await patchSession(id, {})).status).toBe(400);
    expect((await listSessions("?from=2026-02-01&to=2026-01-01")).status).toBe(
      400,
    );
  });

  it("decides what 'today' is from the user's timezone", async () => {
    const east = await prisma.user.create({
      data: {
        email: "east@example.test",
        name: "East",
        timezone: "Pacific/Kiritimati",
      },
    });
    const west = await prisma.user.create({
      data: {
        email: "west@example.test",
        name: "West",
        timezone: "Pacific/Pago_Pago",
      },
    });
    // UTC+14 and UTC-11 are 25 hours apart, so the east date is always the later one.
    const eastToday = todayInTimezone("Pacific/Kiritimati");

    asUser(east.id);
    expect((await createSession(sessionBody({ date: eastToday }))).status).toBe(
      201,
    );

    asUser(west.id);
    const rejected = await read<ErrorBody>(
      createSession(sessionBody({ date: eastToday })),
    );

    expect(rejected.status).toBe(400);
    expect(rejected.body.error.fields).toEqual([
      { path: "date", message: expect.any(String) },
    ]);
  });

  it("never exposes or changes another user's session", async () => {
    const id = await newSession(20);

    asUser(w.bob.id);

    expect((await getSession(id)).status).toBe(404);
    expect((await patchSession(id, { notes: "hacked" })).status).toBe(404);
    expect((await deleteSession(id)).status).toBe(404);
    expect((await read<ListBody>(listSessions())).body.data).toEqual([]);

    asUser(w.alice.id);

    const intact = await read<Data<Session>>(getSession(id));

    expect(intact.body.data).toMatchObject({
      durationMinutes: 20,
      notes: null,
    });
  });
});

describe("practice entries API", () => {
  it("logs, edits and deletes scale entries and keeps the session duration in sync", async () => {
    const sessionId = await newSession(30);

    const first = await read<Data<EntryResult>>(
      addEntry("scale", sessionId, scaleBody()),
    );

    expect(first.status).toBe(201);
    // The manual 30 minutes is replaced by the sum of the entries.
    expect(first.body.data.sessionDurationMinutes).toBe(10);

    const second = await read<Data<EntryResult>>(
      addEntry("scale", sessionId, scaleBody({ durationMinutes: 5 })),
    );

    expect(second.body.data.sessionDurationMinutes).toBe(15);

    const patched = await read<Data<EntryResult>>(
      patchEntry("scale", sessionId, first.body.data.entry.id, {
        durationMinutes: 20,
        notes: "Slow",
      }),
    );

    expect(patched.body.data.sessionDurationMinutes).toBe(25);
    expect(patched.body.data.entry).toMatchObject({
      cleanBpm: 80,
      maxBpm: 96,
      durationMinutes: 20,
      notes: "Slow",
    });

    expect(
      (await deleteEntry("scale", sessionId, first.body.data.entry.id)).status,
    ).toBe(204);
    expect(
      (await read<Data<Session>>(getSession(sessionId))).body.data,
    ).toMatchObject({ durationMinutes: 5 });

    // With no entries left, the last total is kept.
    await deleteEntry("scale", sessionId, second.body.data.entry.id);

    const emptied = await read<Data<Session>>(getSession(sessionId));

    expect(emptied.body.data).toMatchObject({
      durationMinutes: 5,
      scaleEntries: [],
    });
  });

  it("logs exercise entries and adds them to the same session total", async () => {
    const sessionId = await newSession();

    await addEntry("scale", sessionId, scaleBody());

    const added = await read<Data<EntryResult>>(
      addEntry("exercise", sessionId, exerciseBody()),
    );

    expect(added.status).toBe(201);
    expect(added.body.data.sessionDurationMinutes).toBe(25);

    const patched = await read<Data<EntryResult>>(
      patchEntry("exercise", sessionId, added.body.data.entry.id, {
        maxBpm: 90,
      }),
    );

    expect(patched.body.data.entry.maxBpm).toBe(90);
    expect(
      (await deleteEntry("exercise", sessionId, added.body.data.entry.id))
        .status,
    ).toBe(204);
    expect(
      (await read<Data<Session>>(getSession(sessionId))).body.data
        .durationMinutes,
    ).toBe(10);
  });

  it.each(["scale", "exercise"] as const)(
    "enforces clean/max tempo rules on %s entries",
    async (kind) => {
      const sessionId = await newSession();
      const body = kind === "scale" ? scaleBody : exerciseBody;

      const inverted = await read<ErrorBody>(
        addEntry(kind, sessionId, body({ cleanBpm: 100, maxBpm: 90 })),
      );

      expect(inverted.status).toBe(400);
      expect(inverted.body.error.fields).toEqual([
        { path: "maxBpm", message: expect.any(String) },
      ]);

      const outOfRange = await read<ErrorBody>(
        addEntry(kind, sessionId, body({ cleanBpm: 19 })),
      );

      expect(outOfRange.status).toBe(400);
      expect(outOfRange.body.error.fields).toEqual(
        expect.arrayContaining([
          { path: "cleanBpm", message: expect.any(String) },
        ]),
      );

      // On update, the new value is checked against the stored one.
      const created = await read<Data<EntryResult>>(
        addEntry(kind, sessionId, body({ cleanBpm: 60, maxBpm: 70 })),
      );
      const merged = await read<ErrorBody>(
        patchEntry(kind, sessionId, created.body.data.entry.id, {
          cleanBpm: 120,
        }),
      );

      expect(merged.status).toBe(400);
      expect(merged.body.error.fields).toEqual([
        { path: "maxBpm", message: expect.any(String) },
      ]);
    },
  );

  it("does not let the duration be set by hand once a session has entries", async () => {
    const sessionId = await newSession();

    await addEntry("scale", sessionId, scaleBody());

    const conflict = await read<ErrorBody>(
      patchSession(sessionId, { durationMinutes: 99 }),
    );

    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("CONFLICT");
    expect((await patchSession(sessionId, { notes: "ok" })).status).toBe(200);
  });

  it("rejects entries that add up to more than a day and rolls back", async () => {
    const sessionId = await newSession();

    await addEntry("scale", sessionId, scaleBody({ durationMinutes: 1000 }));

    const rejected = await read<ErrorBody>(
      addEntry("scale", sessionId, scaleBody({ durationMinutes: 500 })),
    );

    expect(rejected.status).toBe(400);
    expect(rejected.body.error.fields).toEqual([
      { path: "durationMinutes", message: expect.any(String) },
    ]);

    const session = await read<Data<Session>>(getSession(sessionId));

    expect(session.body.data.durationMinutes).toBe(1000);
    expect(session.body.data.scaleEntries).toHaveLength(1);
  });

  it("keeps entries and tracked items private to their owner", async () => {
    const aliceSession = await newSession();
    const entry = await read<Data<EntryResult>>(
      addEntry("scale", aliceSession, scaleBody()),
    );
    const entryId = entry.body.data.entry.id;

    asUser(w.bob.id);

    // Alice's session, even with Bob's own tracked scale.
    expect(
      (
        await addEntry(
          "scale",
          aliceSession,
          scaleBody({ userScaleId: w.bobScale.id }),
        )
      ).status,
    ).toBe(404);
    expect(
      (await patchEntry("scale", aliceSession, entryId, { notes: "x" })).status,
    ).toBe(404);
    expect((await deleteEntry("scale", aliceSession, entryId)).status).toBe(
      404,
    );

    // Bob's session, but Alice's tracked scale and exercise, or Alice's entry id.
    const bobSession = await newSession();

    expect((await addEntry("scale", bobSession, scaleBody())).status).toBe(404);
    expect(
      (await addEntry("exercise", bobSession, exerciseBody())).status,
    ).toBe(404);
    expect(
      (await patchEntry("scale", bobSession, entryId, { notes: "x" })).status,
    ).toBe(404);

    asUser(w.alice.id);

    const intact = await read<Data<Session>>(getSession(aliceSession));

    expect(intact.body.data.scaleEntries).toMatchObject([
      { id: entryId, notes: null },
    ]);
  });

  it("refuses a tracked exercise whose exercise the user cannot see", async () => {
    // A row the API never creates: Bob tracks Alice's private custom exercise.
    const stray = await prisma.userExercise.create({
      data: { userId: w.bob.id, exerciseId: w.aliceExercise.id, targetBpm: 90 },
    });

    asUser(w.bob.id);

    const sessionId = await newSession();
    const result = await addEntry(
      "exercise",
      sessionId,
      exerciseBody({ userExerciseId: stray.id }),
    );

    expect(result.status).toBe(404);
  });
});
