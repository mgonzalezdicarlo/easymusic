// Query filters that keep exercise access rules in one place (E2-04).
// Catalog exercises (HANON) have no owner and are shared. Czerny and custom exercises belong to
// one user. `userId` must be the authenticated user's id: never pass a possibly undefined value,
// because Prisma ignores filters whose value is `undefined`.

/** Exercises a user may see: the shared catalog plus their own. */
export function visibleExercisesWhere(userId: string) {
  return { OR: [{ ownerId: null }, { ownerId: userId }] };
}

/** Exercises a user may edit or delete: only their own. Catalog exercises never match. */
export function ownedExercisesWhere(userId: string) {
  return { ownerId: userId };
}
