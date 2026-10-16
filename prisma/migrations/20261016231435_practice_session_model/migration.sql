/*
  Warnings:

  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "practice_sessions_userId_date_idx" ON "practice_sessions"("userId", "date");

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Range rules Prisma cannot declare (see ADR-0003 and ADR-0006)
ALTER TABLE "users" ADD CONSTRAINT "users_dailyGoalMinutes_check"
  CHECK ("dailyGoalMinutes" BETWEEN 1 AND 1440);

ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_durationMinutes_check"
  CHECK ("durationMinutes" BETWEEN 0 AND 1440);
