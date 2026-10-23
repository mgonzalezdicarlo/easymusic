import type { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/api/errors";
import { prisma } from "@/server/db";
import { prismaErrorCode, RECORD_NOT_FOUND } from "@/server/tracking/shared";
import type { UpdateProfileInput } from "@/server/users/schemas";

const profileSelect = {
  name: true,
  email: true,
  timezone: true,
  dailyGoalMinutes: true,
  onboardedAt: true,
} satisfies Prisma.UserSelect;

type ProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

/** Public shape of the signed-in user's profile. */
export type Profile = {
  name: string;
  email: string;
  timezone: string;
  dailyGoalMinutes: number;
  onboarded: boolean;
};

function toProfile(row: ProfileRow): Profile {
  return {
    name: row.name,
    email: row.email,
    timezone: row.timezone,
    dailyGoalMinutes: row.dailyGoalMinutes,
    onboarded: row.onboardedAt !== null,
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  // A valid session always has a user. Treat a missing one as signed out.
  if (!user) throw ApiError.unauthorized();

  return toProfile(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        timezone: input.timezone,
        dailyGoalMinutes: input.dailyGoalMinutes,
        onboardedAt: input.completeOnboarding ? new Date() : undefined,
      },
      select: profileSelect,
    });

    return toProfile(user);
  } catch (error) {
    if (prismaErrorCode(error) === RECORD_NOT_FOUND) {
      throw ApiError.unauthorized();
    }

    throw error;
  }
}

/**
 * Permanently deletes the user. Sessions, accounts, practice sessions, tracked scales and
 * exercises, custom exercises and all entries are removed by ON DELETE CASCADE.
 */
export async function deleteAccount(userId: string) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) throw ApiError.unauthorized();

    // Verification rows are keyed by email, not by a foreign key.
    await tx.verification.deleteMany({ where: { identifier: user.email } });
    await tx.user.delete({ where: { id: userId } });
  });
}
