import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { toSkipTake } from "@/server/api/pagination";
import { prisma } from "@/server/db";
import { fromDbDate, todayInTimezone, toDbDate } from "@/server/sessions/dates";
import type {
  CreateSessionInput,
  ListSessionsQuery,
  UpdateSessionInput,
} from "@/server/sessions/schemas";

/** The shared Prisma client, or the client of an interactive transaction. */
export type Db = Prisma.TransactionClient;

const SESSION_NOT_FOUND = "Practice session not found.";

const asc = "asc" as const;
const entryOrder = [{ practicedAt: asc }, { id: asc }];
const sessionInclude = {
  scaleEntries: { orderBy: entryOrder },
  exerciseEntries: { orderBy: entryOrder },
};

function findOwnedSession(db: Db, userId: string, id: string) {
  return db.practiceSession.findFirst({
    where: { id, userId },
    include: sessionInclude,
  });
}

type SessionRow = NonNullable<Awaited<ReturnType<typeof findOwnedSession>>>;

/** Public shape of a session: `date` is YYYY-MM-DD and `userId` is not exposed. */
export function toSessionResponse(session: SessionRow) {
  return {
    id: session.id,
    date: fromDbDate(session.date),
    durationMinutes: session.durationMinutes,
    notes: session.notes,
    createdAt: session.createdAt,
    scaleEntries: session.scaleEntries,
    exerciseEntries: session.exerciseEntries,
  };
}

/**
 * Locks the session row for the rest of the transaction and proves the user owns it, so
 * concurrent entry writes cannot leave a stale session duration. Throws 404 otherwise.
 */
export async function lockOwnedSession(
  tx: Db,
  userId: string,
  sessionId: string,
) {
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`SELECT "id" FROM "practice_sessions" WHERE "id" = ${sessionId} AND "userId" = ${userId} FOR UPDATE`;

  if (rows.length === 0) throw ApiError.notFound(SESSION_NOT_FOUND);
}

async function assertNotInFuture(db: Db, userId: string, date: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user) throw ApiError.unauthorized();

  if (date > todayInTimezone(user.timezone)) {
    throw ApiError.validation([
      { path: "date", message: "Date cannot be in the future." },
    ]);
  }
}

export async function listSessions(userId: string, query: ListSessionsQuery) {
  const where = {
    userId,
    date: {
      gte: query.from ? toDbDate(query.from) : undefined,
      lte: query.to ? toDbDate(query.to) : undefined,
    },
  };

  const [rows, total] = await Promise.all([
    prisma.practiceSession.findMany({
      where,
      include: sessionInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      ...toSkipTake(query),
    }),
    prisma.practiceSession.count({ where }),
  ]);

  return { items: rows.map(toSessionResponse), total };
}

export async function getSession(userId: string, id: string) {
  const session = await findOwnedSession(prisma, userId, id);

  if (!session) throw ApiError.notFound(SESSION_NOT_FOUND);

  return toSessionResponse(session);
}

export async function createSession(userId: string, input: CreateSessionInput) {
  await assertNotInFuture(prisma, userId, input.date);

  const session = await prisma.practiceSession.create({
    data: {
      userId,
      date: toDbDate(input.date),
      durationMinutes: input.durationMinutes,
      notes: input.notes,
    },
    include: sessionInclude,
  });

  return toSessionResponse(session);
}

export function updateSession(
  userId: string,
  id: string,
  input: UpdateSessionInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedSession(tx, userId, id);

    if (input.date !== undefined) {
      await assertNotInFuture(tx, userId, input.date);
    }

    if (input.durationMinutes !== undefined) {
      const entryCount =
        (await tx.scalePracticeEntry.count({ where: { sessionId: id } })) +
        (await tx.exercisePracticeEntry.count({ where: { sessionId: id } }));

      if (entryCount > 0) {
        throw ApiError.conflict(
          "Duration is calculated from the session's entries. Edit or remove entries to change it.",
        );
      }
    }

    await tx.practiceSession.update({
      where: { id, userId },
      data: {
        date: input.date ? toDbDate(input.date) : undefined,
        durationMinutes: input.durationMinutes,
        notes: input.notes,
      },
    });

    const session = await findOwnedSession(tx, userId, id);

    if (!session) throw ApiError.notFound(SESSION_NOT_FOUND);

    return toSessionResponse(session);
  });
}

/** Entries are removed with the session (ON DELETE CASCADE). */
export async function deleteSession(userId: string, id: string) {
  const { count } = await prisma.practiceSession.deleteMany({
    where: { id, userId },
  });

  if (count === 0) throw ApiError.notFound(SESSION_NOT_FOUND);
}
