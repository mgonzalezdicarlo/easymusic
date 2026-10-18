-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('HANON', 'CZERNY', 'CUSTOM');

-- CreateTable
CREATE TABLE "exercises" (
                             "id" TEXT NOT NULL,
                             "source" "ExerciseSource" NOT NULL,
                             "number" INTEGER,
                             "title" TEXT NOT NULL,
                             "description" TEXT,
                             "targetBpm" INTEGER,
                             "ownerId" TEXT,

                             CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_exercises" (
                                  "id" TEXT NOT NULL,
                                  "userId" TEXT NOT NULL,
                                  "exerciseId" TEXT NOT NULL,
                                  "targetBpm" INTEGER NOT NULL,
                                  "status" "TrackingStatus" NOT NULL DEFAULT 'ACTIVE',
                                  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT "user_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_practice_entries" (
                                             "id" TEXT NOT NULL,
                                             "userExerciseId" TEXT NOT NULL,
                                             "sessionId" TEXT NOT NULL,
                                             "cleanBpm" INTEGER NOT NULL,
                                             "maxBpm" INTEGER NOT NULL,
                                             "durationMinutes" INTEGER NOT NULL,
                                             "notes" TEXT,
                                             "practicedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                             CONSTRAINT "exercise_practice_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_ownerId_source_number_key" ON "exercises"("ownerId", "source", "number");

-- CreateIndex
CREATE UNIQUE INDEX "user_exercises_userId_exerciseId_key" ON "user_exercises"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "user_exercises_exerciseId_idx" ON "user_exercises"("exerciseId");

-- CreateIndex
CREATE INDEX "exercise_practice_entries_userExerciseId_practicedAt_idx" ON "exercise_practice_entries"("userExerciseId", "practicedAt");

-- CreateIndex
CREATE INDEX "exercise_practice_entries_sessionId_idx" ON "exercise_practice_entries"("sessionId");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_practice_entries" ADD CONSTRAINT "exercise_practice_entries_userExerciseId_fkey" FOREIGN KEY ("userExerciseId") REFERENCES "user_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_practice_entries" ADD CONSTRAINT "exercise_practice_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rules Prisma cannot declare (see ADR-0003 and ADR-0006)

-- Catalog (HANON) exercises have no owner. Czerny and custom exercises require one.
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_source_owner_check"
    CHECK (
        ("source" = 'HANON' AND "ownerId" IS NULL)
            OR ("source" IN ('CZERNY', 'CUSTOM') AND "ownerId" IS NOT NULL)
        );

ALTER TABLE "exercises" ADD CONSTRAINT "exercises_number_check"
    CHECK ("number" IS NULL OR "number" > 0);

ALTER TABLE "exercises" ADD CONSTRAINT "exercises_hanon_number_check"
    CHECK ("source" <> 'HANON' OR ("number" IS NOT NULL AND "number" BETWEEN 1 AND 60));

ALTER TABLE "exercises" ADD CONSTRAINT "exercises_targetBpm_check"
    CHECK ("targetBpm" IS NULL OR "targetBpm" BETWEEN 20 AND 300);

-- One catalog row per (source, number). The unique index above cannot cover this because
-- NULL owners are never equal to each other.
CREATE UNIQUE INDEX "exercises_source_number_catalog_key"
    ON "exercises"("source", "number") WHERE "ownerId" IS NULL;

ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_targetBpm_check"
    CHECK ("targetBpm" BETWEEN 20 AND 300);

-- Same BPM rules as scale_practice_entries
ALTER TABLE "exercise_practice_entries" ADD CONSTRAINT "exercise_practice_entries_cleanBpm_check"
    CHECK ("cleanBpm" BETWEEN 20 AND 300);

ALTER TABLE "exercise_practice_entries" ADD CONSTRAINT "exercise_practice_entries_maxBpm_check"
    CHECK ("maxBpm" BETWEEN 20 AND 300);

ALTER TABLE "exercise_practice_entries" ADD CONSTRAINT "exercise_practice_entries_maxBpm_gte_cleanBpm_check"
    CHECK ("maxBpm" >= "cleanBpm");

ALTER TABLE "exercise_practice_entries" ADD CONSTRAINT "exercise_practice_entries_durationMinutes_check"
    CHECK ("durationMinutes" BETWEEN 0 AND 1440);