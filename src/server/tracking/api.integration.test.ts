import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import * as exerciseRoute from "@/app/api/exercises/[exerciseId]/route";
import * as exercisesRoute from "@/app/api/exercises/route";
import * as scalesRoute from "@/app/api/scales/route";
import * as userExerciseRoute from "@/app/api/user-exercises/[userExerciseId]/route";
import * as userExercisesRoute from "@/app/api/user-exercises/route";
import * as userScaleRoute from "@/app/api/user-scales/[userScaleId]/route";
import * as userScalesRoute from "@/app/api/user-scales/route";
import { ApiError } from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";

// E3-01 replaces the real requireUser. Tests choose who is signed in.
vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

type Data<T> = { data: T };
type List<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
type ScaleRef = { id: string; tonic: string; mode: string };
type UserScale = {
  id: string;
  scaleId: string;
  octaves: number;
  handsMode: string;
  targetBpm: number;
  status: string;
  scale: ScaleRef;
};
type Exercise = {
  id: string;
  source: string;
  number: number | null;
  title: string;
  description: string | null;
  targetBpm: number | null;
};
type UserExercise = {
  id: string;
  exerciseId: string;
  targetBpm: number;
  status: string;
  exercise: Exercise;
};
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

const context = <T extends Record<string, string>>(value: T) => ({
  params: Promise.resolve(value),
});

async function read<T>(pending: Response | Promise<Response>) {
  const response = await pending;

  return { status: response.status, body: (await response.json()) as T };
}

const listScales = (query = "") =>
  scalesRoute.GET(request("GET", `/api/scales${query}`), undefined);
const listUserScales = (query = "") =>
  userScalesRoute.GET(request("GET", `/api/user-scales${query}`), undefined);
const createUserScale = (body: unknown) =>
  userScalesRoute.POST(request("POST", "/api/user-scales", body), undefined);
const patchUserScale = (id: string, body: unknown) =>
  userScaleRoute.PATCH(
    request("PATCH", `/api/user-scales/${id}`, body),
    context({ userScaleId: id }),
  );
const deleteUserScale = (id: string, query = "") =>
  userScaleRoute.DELETE(
    request("DELETE", `/api/user-scales/${id}${query}`),
    context({ userScaleId: id }),
  );

const listExercises = (query = "") =>
  exercisesRoute.GET(request("GET", `/api/exercises${query}`), undefined);
const createExercise = (body: unknown) =>
  exercisesRoute.POST(request("POST", "/api/exercises", body), undefined);
const patchExercise = (id: string, body: unknown) =>
  exerciseRoute.PATCH(
    request("PATCH", `/api/exercises/${id}`, body),
    context({ exerciseId: id }),
  );
const deleteExercise = (id: string, query = "") =>
  exerciseRoute.DELETE(
    request("DELETE", `/api/exercises/${id}${query}`),
    context({ exerciseId: id }),
  );

const listUserExercises = (query = "") =>
  userExercisesRoute.GET(
    request("GET", `/api/user-exercises${query}`),
    undefined,
  );
const createUserExercise = (body: unknown) =>
  userExercisesRoute.POST(
    request("POST", "/api/user-exercises", body),
    undefined,
  );
const patchUserExercise = (id: string, body: unknown) =>
  userExerciseRoute.PATCH(
    request("PATCH", `/api/user-exercises/${id}`, body),
    context({ userExerciseId: id }),
  );
const deleteUserExercise = (id: string, query = "") =>
  userExerciseRoute.DELETE(
    request("DELETE", `/api/user-exercises/${id}${query}`),
    context({ userExerciseId: id }),
  );

async function seedWorld() {
  const alice = await prisma.user.create({
    data: { email: "alice@example.test", name: "Alice" },
  });
  const bob = await prisma.user.create({
    data: { email: "bob@example.test", name: "Bob" },
  });
  const scale = (tonic: string, mode: "MAJOR" | "NATURAL_MINOR") =>
    prisma.scale.upsert({
      where: { tonic_mode: { tonic, mode } },
      update: {},
      create: { tonic, mode },
    });
  const hanon = (number: number) =>
    prisma.exercise.upsert({
      where: { id: `hanon-${number}` },
      update: {},
      create: {
        id: `hanon-${number}`,
        source: "HANON",
        number,
        title: `Hanon No. ${number}`,
      },
    });

  return {
    alice,
    bob,
    cMajor: await scale("C", "MAJOR"),
    aMinor: await scale("A", "NATURAL_MINOR"),
    hanon1: await hanon(1),
    hanon2: await hanon(2),
  };
}

let w: Awaited<ReturnType<typeof seedWorld>>;

const scaleBody = (extra: object = {}) => ({
  scaleId: w.cMajor.id,
  octaves: 2,
  handsMode: "TOGETHER",
  targetBpm: 120,
  ...extra,
});
const exerciseBody = (extra: object = {}) => ({
  source: "CUSTOM",
  title: "Zzz drill",
  ...extra,
});
const trackBody = (exerciseId: string, extra: object = {}) => ({
  exerciseId,
  targetBpm: 100,
  ...extra,
});

async function trackScale(extra: object = {}) {
  const { body } = await read<Data<UserScale>>(
    createUserScale(scaleBody(extra)),
  );

  return body.data.id;
}

async function newExercise(extra: object = {}) {
  const { body } = await read<Data<Exercise>>(
    createExercise(exerciseBody(extra)),
  );

  return body.data;
}

async function trackExercise(exerciseId: string, extra: object = {}) {
  const { body } = await read<Data<UserExercise>>(
    createUserExercise(trackBody(exerciseId, extra)),
  );

  return body.data.id;
}

function newSession(userId: string) {
  return prisma.practiceSession.create({
    data: {
      userId,
      date: new Date("2026-01-15T00:00:00.000Z"),
      durationMinutes: 10,
    },
  });
}

beforeEach(async () => {
  // Cascades to tracked items, custom exercises and entries. The shared catalog is kept.
  await prisma.user.deleteMany();
  w = await seedWorld();
  asUser(w.alice.id);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authentication", () => {
  it("answers 401 on every endpoint without a signed-in user", async () => {
    vi.mocked(requireUser).mockRejectedValue(ApiError.unauthorized());

    const responses = await Promise.all([
      listScales(),
      listUserScales(),
      createUserScale({}),
      patchUserScale("x", {}),
      deleteUserScale("x"),
      listExercises(),
      createExercise({}),
      patchExercise("x", {}),
      deleteExercise("x"),
      listUserExercises(),
      createUserExercise({}),
      patchUserExercise("x", {}),
      deleteUserExercise("x"),
    ]);

    expect(new Set(responses.map((response) => response.status))).toEqual(
      new Set([401]),
    );
  });
});

describe("scale catalog", () => {
  it("filters by tonic and mode", async () => {
    const one = await read<List<ScaleRef>>(listScales("?tonic=C&mode=MAJOR"));

    expect(one.status).toBe(200);
    expect(one.body.data).toMatchObject([{ tonic: "C", mode: "MAJOR" }]);

    const minor = await read<List<ScaleRef>>(
      listScales("?mode=NATURAL_MINOR&pageSize=100"),
    );

    expect(minor.body.data.length).toBeGreaterThan(0);
    expect(minor.body.data.every((s) => s.mode === "NATURAL_MINOR")).toBe(true);
    expect(minor.body.data.map((s) => s.tonic)).toContain("A");
  });

  it.each(["?mode=BLUES", "?tonic=H", "?pageSize=0"])(
    "rejects invalid filters %s",
    async (query) => {
      const result = await read<ErrorBody>(listScales(query));

      expect(result.status).toBe(400);
      expect(result.body.error.code).toBe("VALIDATION_ERROR");
    },
  );
});

describe("tracked scales", () => {
  it("tracks a scale with its configuration", async () => {
    const created = await read<Data<UserScale>>(createUserScale(scaleBody()));

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      scaleId: w.cMajor.id,
      octaves: 2,
      handsMode: "TOGETHER",
      targetBpm: 120,
      status: "ACTIVE",
      scale: { tonic: "C", mode: "MAJOR" },
    });
    expect(created.body.data).not.toHaveProperty("userId");
  });

  it("answers 409 for a duplicate configuration but allows other ones", async () => {
    await trackScale();

    const duplicate = await read<ErrorBody>(
      createUserScale(scaleBody({ targetBpm: 90 })),
    );

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("CONFLICT");
    expect((await createUserScale(scaleBody({ octaves: 4 }))).status).toBe(201);
    expect(
      (await createUserScale(scaleBody({ handsMode: "SEPARATE" }))).status,
    ).toBe(201);

    asUser(w.bob.id);

    expect((await createUserScale(scaleBody())).status).toBe(201);
  });

  it.each([
    [{ octaves: 5 }, "octaves"],
    [{ octaves: 0 }, "octaves"],
    [{ targetBpm: 19 }, "targetBpm"],
    [{ targetBpm: 301 }, "targetBpm"],
    [{ handsMode: "LEFT" }, "handsMode"],
    [{ scaleId: "" }, "scaleId"],
  ])("rejects invalid input %j", async (extra, path) => {
    const result = await read<ErrorBody>(createUserScale(scaleBody(extra)));

    expect(result.status).toBe(400);
    expect(result.body.error.fields).toEqual(
      expect.arrayContaining([{ path, message: expect.any(String) }]),
    );
  });

  it("rejects unknown fields and unknown scales", async () => {
    expect((await createUserScale(scaleBody({ userId: "x" }))).status).toBe(
      400,
    );
    expect((await createUserScale(scaleBody({ scaleId: "nope" }))).status).toBe(
      404,
    );
  });

  it("lists only the user's own tracked scales, filtered by status", async () => {
    const first = await trackScale();

    await trackScale({ octaves: 3 });
    await patchUserScale(first, { status: "ARCHIVED" });

    asUser(w.bob.id);
    await trackScale({ scaleId: w.aMinor.id });
    asUser(w.alice.id);

    const all = await read<List<UserScale>>(listUserScales());
    const archived = await read<List<UserScale>>(
      listUserScales("?status=ARCHIVED"),
    );

    expect(all.body.pagination.total).toBe(2);
    expect(all.body.data.every((s) => s.scaleId === w.cMajor.id)).toBe(true);
    expect(archived.body.data.map((s) => s.id)).toEqual([first]);
  });

  it("updates the target, status and configuration", async () => {
    const id = await trackScale();

    const updated = await read<Data<UserScale>>(
      patchUserScale(id, { targetBpm: 100, status: "ARCHIVED", octaves: 4 }),
    );

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      id,
      targetBpm: 100,
      status: "ARCHIVED",
      octaves: 4,
    });
  });

  it("answers 409 when an update would duplicate another configuration", async () => {
    await trackScale({ octaves: 2 });

    const other = await trackScale({ octaves: 3 });
    const conflict = await read<ErrorBody>(
      patchUserScale(other, { octaves: 2 }),
    );

    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("CONFLICT");
  });

  it("rejects empty updates and fields that cannot change", async () => {
    const id = await trackScale();

    expect((await patchUserScale(id, {})).status).toBe(400);
    expect((await patchUserScale(id, { scaleId: w.aMinor.id })).status).toBe(
      400,
    );
    expect((await patchUserScale(id, { octaves: 9 })).status).toBe(400);
  });

  it("never exposes or changes another user's tracked scale", async () => {
    const id = await trackScale();

    asUser(w.bob.id);

    expect((await patchUserScale(id, { targetBpm: 60 })).status).toBe(404);
    expect((await deleteUserScale(id)).status).toBe(404);
    expect((await read<List<UserScale>>(listUserScales())).body.data).toEqual(
      [],
    );

    const intact = await prisma.userScale.findUniqueOrThrow({ where: { id } });

    expect(intact).toMatchObject({ userId: w.alice.id, targetBpm: 120 });
  });

  it("deletes a scale without history right away", async () => {
    const id = await trackScale();

    expect((await deleteUserScale(id)).status).toBe(204);
    expect((await deleteUserScale(id)).status).toBe(404);
  });

  it("asks for confirmation before deleting history, and archiving keeps it", async () => {
    const id = await trackScale();
    const session = await newSession(w.alice.id);

    await prisma.scalePracticeEntry.create({
      data: {
        userScaleId: id,
        sessionId: session.id,
        cleanBpm: 80,
        maxBpm: 90,
        durationMinutes: 10,
      },
    });

    const blocked = await read<ErrorBody>(deleteUserScale(id));

    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe("CONFLICT");
    expect((await deleteUserScale(id, "?confirm=yes")).status).toBe(400);

    await patchUserScale(id, { status: "ARCHIVED" });

    expect(
      await prisma.scalePracticeEntry.count({ where: { userScaleId: id } }),
    ).toBe(1);
    expect((await deleteUserScale(id, "?confirm=true")).status).toBe(204);
    expect(
      await prisma.scalePracticeEntry.count({ where: { userScaleId: id } }),
    ).toBe(0);
  });
});

describe("exercise catalog", () => {
  it("lists the shared catalog and only the user's own exercises", async () => {
    await newExercise({ number: 4321 });

    asUser(w.bob.id);
    await newExercise({ title: "Zzz bob drill", number: 4321 });
    asUser(w.alice.id);

    const hanon = await read<List<Exercise>>(
      listExercises("?source=HANON&pageSize=100"),
    );

    expect(hanon.body.data.every((e) => e.source === "HANON")).toBe(true);
    expect(hanon.body.data.map((e) => e.number)).toEqual(
      expect.arrayContaining([1, 2]),
    );

    const mine = await read<List<Exercise>>(listExercises("?search=zzz"));

    expect(mine.body.data).toMatchObject([{ title: "Zzz drill" }]);
    expect(mine.body.data[0]).not.toHaveProperty("ownerId");
  });

  it("filters by source and searches by number or title", async () => {
    await newExercise({ source: "CZERNY", title: "Op. 299 No. 1", number: 1 });
    await newExercise({ title: "Zzz drill", number: 4321 });

    const czerny = await read<List<Exercise>>(listExercises("?source=CZERNY"));
    const byTitle = await read<List<Exercise>>(
      listExercises("?search=OP.%20299"),
    );
    const byNumber = await read<List<Exercise>>(listExercises("?search=4321"));
    const blank = await read<List<Exercise>>(
      listExercises("?search=%20&source=CZERNY"),
    );

    expect(czerny.body.data).toMatchObject([{ source: "CZERNY" }]);
    expect(byTitle.body.data).toMatchObject([{ title: "Op. 299 No. 1" }]);
    expect(byNumber.body.data).toMatchObject([{ title: "Zzz drill" }]);
    expect(blank.body.pagination.total).toBe(1);
    expect((await listExercises("?source=PIANO")).status).toBe(400);
  });
});

describe("custom exercises", () => {
  it("creates a custom exercise owned by the user", async () => {
    const created = await read<Data<Exercise>>(
      createExercise({
        source: "CZERNY",
        title: "  Op. 299 No. 1  ",
        number: 1,
        description: "  Legato  ",
        targetBpm: 120,
      }),
    );

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      source: "CZERNY",
      title: "Op. 299 No. 1",
      number: 1,
      description: "Legato",
      targetBpm: 120,
    });

    const row = await prisma.exercise.findUniqueOrThrow({
      where: { id: created.body.data.id },
    });

    expect(row.ownerId).toBe(w.alice.id);
  });

  it("answers 409 for the same source and number, but not across users or sources", async () => {
    await newExercise({ source: "CZERNY", number: 1 });

    const duplicate = await read<ErrorBody>(
      createExercise(exerciseBody({ source: "CZERNY", number: 1 })),
    );

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("CONFLICT");
    expect(
      (await createExercise(exerciseBody({ source: "CUSTOM", number: 1 })))
        .status,
    ).toBe(201);
    expect((await createExercise(exerciseBody())).status).toBe(201);
    expect((await createExercise(exerciseBody())).status).toBe(201);

    asUser(w.bob.id);

    expect(
      (await createExercise(exerciseBody({ source: "CZERNY", number: 1 })))
        .status,
    ).toBe(201);
  });

  it.each([
    [{ source: "HANON" }, "source"],
    [{ number: 0 }, "number"],
    [{ title: "   " }, "title"],
    [{ targetBpm: 10 }, "targetBpm"],
  ])("rejects invalid input %j", async (extra, path) => {
    const result = await read<ErrorBody>(createExercise(exerciseBody(extra)));

    expect(result.status).toBe(400);
    expect(result.body.error.fields).toEqual(
      expect.arrayContaining([{ path, message: expect.any(String) }]),
    );
    expect((await createExercise(exerciseBody({ ownerId: "x" }))).status).toBe(
      400,
    );
  });

  it("updates the owner's exercise and can clear optional fields", async () => {
    const exercise = await newExercise({
      number: 5,
      description: "Slow",
      targetBpm: 90,
    });

    const updated = await read<Data<Exercise>>(
      patchExercise(exercise.id, {
        title: "Renamed",
        number: null,
        description: null,
        targetBpm: null,
      }),
    );

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      title: "Renamed",
      number: null,
      description: null,
      targetBpm: null,
    });
    expect((await patchExercise(exercise.id, {})).status).toBe(400);
  });

  it("answers 409 when an update would duplicate source and number", async () => {
    await newExercise({ source: "CZERNY", number: 1 });

    const second = await newExercise({ source: "CZERNY", number: 2 });
    const conflict = await read<ErrorBody>(
      patchExercise(second.id, { number: 1 }),
    );

    expect(conflict.status).toBe(409);
  });

  it("keeps catalog exercises read-only", async () => {
    const patch = await read<ErrorBody>(
      patchExercise(w.hanon1.id, { title: "Hacked" }),
    );

    expect(patch.status).toBe(403);
    expect(patch.body.error.code).toBe("FORBIDDEN");
    expect((await deleteExercise(w.hanon1.id)).status).toBe(403);

    const intact = await prisma.exercise.findUniqueOrThrow({
      where: { id: w.hanon1.id },
    });

    expect(intact.title).toBe("Hanon No. 1");
  });

  it("never exposes or changes another user's exercise", async () => {
    const exercise = await newExercise();

    asUser(w.bob.id);

    expect((await patchExercise(exercise.id, { title: "Hacked" })).status).toBe(
      404,
    );
    expect((await deleteExercise(exercise.id)).status).toBe(404);
    expect((await patchExercise("nope", { title: "x" })).status).toBe(404);

    const intact = await prisma.exercise.findUniqueOrThrow({
      where: { id: exercise.id },
    });

    expect(intact).toMatchObject({ title: "Zzz drill", ownerId: w.alice.id });
  });

  it("deletes an exercise without history, with its tracking", async () => {
    const exercise = await newExercise();
    const trackedId = await trackExercise(exercise.id);

    expect((await deleteExercise(exercise.id)).status).toBe(204);
    expect(await prisma.userExercise.count({ where: { id: trackedId } })).toBe(
      0,
    );
  });

  it("asks for confirmation before deleting an exercise that has history", async () => {
    const exercise = await newExercise();
    const trackedId = await trackExercise(exercise.id);
    const session = await newSession(w.alice.id);

    await prisma.exercisePracticeEntry.create({
      data: {
        userExerciseId: trackedId,
        sessionId: session.id,
        cleanBpm: 60,
        maxBpm: 70,
        durationMinutes: 5,
      },
    });

    const blocked = await read<ErrorBody>(deleteExercise(exercise.id));

    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe("CONFLICT");
    expect(await prisma.exercise.count({ where: { id: exercise.id } })).toBe(1);
    expect((await deleteExercise(exercise.id, "?confirm=true")).status).toBe(
      204,
    );
    expect(
      await prisma.exercisePracticeEntry.count({
        where: { sessionId: session.id },
      }),
    ).toBe(0);
  });
});

describe("tracked exercises", () => {
  it("tracks catalog and custom exercises", async () => {
    const custom = await newExercise();

    const catalog = await read<Data<UserExercise>>(
      createUserExercise(trackBody(w.hanon1.id)),
    );
    const own = await read<Data<UserExercise>>(
      createUserExercise(trackBody(custom.id, { targetBpm: 80 })),
    );

    expect(catalog.status).toBe(201);
    expect(catalog.body.data).toMatchObject({
      exerciseId: w.hanon1.id,
      targetBpm: 100,
      status: "ACTIVE",
      exercise: { source: "HANON", number: 1 },
    });
    expect(catalog.body.data).not.toHaveProperty("userId");
    expect(own.status).toBe(201);
    expect(own.body.data.exercise.title).toBe("Zzz drill");
  });

  it("answers 409 for an exercise that is already tracked", async () => {
    await trackExercise(w.hanon1.id);

    const duplicate = await read<ErrorBody>(
      createUserExercise(trackBody(w.hanon1.id, { targetBpm: 60 })),
    );

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("CONFLICT");

    asUser(w.bob.id);

    expect((await createUserExercise(trackBody(w.hanon1.id))).status).toBe(201);
  });

  it("refuses unknown exercises and other users' custom exercises", async () => {
    const custom = await newExercise();

    asUser(w.bob.id);

    expect((await createUserExercise(trackBody(custom.id))).status).toBe(404);
    expect((await createUserExercise(trackBody("nope"))).status).toBe(404);
  });

  it.each([
    [{ targetBpm: 19 }, "targetBpm"],
    [{ targetBpm: 301 }, "targetBpm"],
    [{ exerciseId: "" }, "exerciseId"],
  ])("rejects invalid input %j", async (extra, path) => {
    const result = await read<ErrorBody>(
      createUserExercise(trackBody(w.hanon1.id, extra)),
    );

    expect(result.status).toBe(400);
    expect(result.body.error.fields).toEqual(
      expect.arrayContaining([{ path, message: expect.any(String) }]),
    );
    expect(
      (await createUserExercise(trackBody(w.hanon1.id, { userId: "x" })))
        .status,
    ).toBe(400);
  });

  it("lists only the user's own tracked exercises, filtered by status", async () => {
    const first = await trackExercise(w.hanon1.id);

    await trackExercise(w.hanon2.id);
    await patchUserExercise(first, { status: "ARCHIVED" });

    asUser(w.bob.id);
    await trackExercise(w.hanon1.id);
    asUser(w.alice.id);

    const all = await read<List<UserExercise>>(listUserExercises());
    const archived = await read<List<UserExercise>>(
      listUserExercises("?status=ARCHIVED"),
    );

    expect(all.body.pagination.total).toBe(2);
    expect(archived.body.data.map((e) => e.id)).toEqual([first]);
  });

  it("updates the target and status", async () => {
    const id = await trackExercise(w.hanon1.id);

    const updated = await read<Data<UserExercise>>(
      patchUserExercise(id, { targetBpm: 140, status: "ARCHIVED" }),
    );

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      id,
      targetBpm: 140,
      status: "ARCHIVED",
    });
    expect((await patchUserExercise(id, {})).status).toBe(400);
    expect((await patchUserExercise(id, { exerciseId: "x" })).status).toBe(400);
  });

  it("never exposes or changes another user's tracked exercise", async () => {
    const id = await trackExercise(w.hanon1.id);

    asUser(w.bob.id);

    expect((await patchUserExercise(id, { targetBpm: 60 })).status).toBe(404);
    expect((await deleteUserExercise(id)).status).toBe(404);
    expect(
      (await read<List<UserExercise>>(listUserExercises())).body.data,
    ).toEqual([]);

    const intact = await prisma.userExercise.findUniqueOrThrow({
      where: { id },
    });

    expect(intact).toMatchObject({ userId: w.alice.id, targetBpm: 100 });
  });

  it("deletes tracking without history right away", async () => {
    const id = await trackExercise(w.hanon1.id);

    expect((await deleteUserExercise(id)).status).toBe(204);
    expect((await deleteUserExercise(id)).status).toBe(404);
    expect(await prisma.exercise.count({ where: { id: w.hanon1.id } })).toBe(1);
  });

  it("asks for confirmation before deleting history, and archiving keeps it", async () => {
    const id = await trackExercise(w.hanon1.id);
    const session = await newSession(w.alice.id);

    await prisma.exercisePracticeEntry.create({
      data: {
        userExerciseId: id,
        sessionId: session.id,
        cleanBpm: 60,
        maxBpm: 70,
        durationMinutes: 5,
      },
    });

    const blocked = await read<ErrorBody>(deleteUserExercise(id));

    expect(blocked.status).toBe(409);

    await patchUserExercise(id, { status: "ARCHIVED" });

    expect(
      await prisma.exercisePracticeEntry.count({
        where: { userExerciseId: id },
      }),
    ).toBe(1);
    expect((await deleteUserExercise(id, "?confirm=true")).status).toBe(204);
    expect(
      await prisma.exercisePracticeEntry.count({
        where: { userExerciseId: id },
      }),
    ).toBe(0);
    expect(await prisma.exercise.count({ where: { id: w.hanon1.id } })).toBe(1);
  });
});
