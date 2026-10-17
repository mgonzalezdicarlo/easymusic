-- CreateEnum
CREATE TYPE "ScaleMode" AS ENUM ('MAJOR', 'NATURAL_MINOR', 'HARMONIC_MINOR', 'MELODIC_MINOR', 'DORIAN', 'PHRYGIAN', 'LYDIAN', 'MIXOLYDIAN', 'LOCRIAN');

-- CreateEnum
CREATE TYPE "HandsMode" AS ENUM ('SEPARATE', 'TOGETHER');

-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "scales" (
                          "id" TEXT NOT NULL,
                          "tonic" TEXT NOT NULL,
                          "mode" "ScaleMode" NOT NULL,

                          CONSTRAINT "scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_scales" (
                               "id" TEXT NOT NULL,
                               "userId" TEXT NOT NULL,
                               "scaleId" TEXT NOT NULL,
                               "octaves" INTEGER NOT NULL,
                               "handsMode" "HandsMode" NOT NULL,
                               "targetBpm" INTEGER NOT NULL,
                               "status" "TrackingStatus" NOT NULL DEFAULT 'ACTIVE',
                               "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT "user_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_practice_entries" (
                                          "id" TEXT NOT NULL,
                                          "userScaleId" TEXT NOT NULL,
                                          "sessionId" TEXT NOT NULL,
                                          "cleanBpm" INTEGER NOT NULL,
                                          "maxBpm" INTEGER NOT NULL,
                                          "durationMinutes" INTEGER NOT NULL,
                                          "notes" TEXT,
                                          "practicedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                          CONSTRAINT "scale_practice_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scales_tonic_mode_key" ON "scales"("tonic", "mode");

-- CreateIndex
CREATE INDEX "user_scales_scaleId_idx" ON "user_scales"("scaleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_scales_userId_scaleId_octaves_handsMode_key" ON "user_scales"("userId", "scaleId", "octaves", "handsMode");

-- CreateIndex
CREATE INDEX "scale_practice_entries_userScaleId_practicedAt_idx" ON "scale_practice_entries"("userScaleId", "practicedAt");

-- CreateIndex
CREATE INDEX "scale_practice_entries_sessionId_idx" ON "scale_practice_entries"("sessionId");

-- AddForeignKey
ALTER TABLE "user_scales" ADD CONSTRAINT "user_scales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_scales" ADD CONSTRAINT "user_scales_scaleId_fkey" FOREIGN KEY ("scaleId") REFERENCES "scales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_practice_entries" ADD CONSTRAINT "scale_practice_entries_userScaleId_fkey" FOREIGN KEY ("userScaleId") REFERENCES "user_scales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_practice_entries" ADD CONSTRAINT "scale_practice_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rules Prisma cannot declare (see ADR-0003 and ADR-0006)
ALTER TABLE "scales" ADD CONSTRAINT "scales_tonic_check"
    CHECK ("tonic" ~ '^[A-G][#b]?$');

ALTER TABLE "user_scales" ADD CONSTRAINT "user_scales_octaves_check"
    CHECK ("octaves" BETWEEN 1 AND 4);

ALTER TABLE "user_scales" ADD CONSTRAINT "user_scales_targetBpm_check"
    CHECK ("targetBpm" BETWEEN 20 AND 300);

ALTER TABLE "scale_practice_entries" ADD CONSTRAINT "scale_practice_entries_cleanBpm_check"
    CHECK ("cleanBpm" BETWEEN 20 AND 300);

ALTER TABLE "scale_practice_entries" ADD CONSTRAINT "scale_practice_entries_maxBpm_check"
    CHECK ("maxBpm" BETWEEN 20 AND 300);

ALTER TABLE "scale_practice_entries" ADD CONSTRAINT "scale_practice_entries_maxBpm_gte_cleanBpm_check"
    CHECK ("maxBpm" >= "cleanBpm");

ALTER TABLE "scale_practice_entries" ADD CONSTRAINT "scale_practice_entries_durationMinutes_check"
    CHECK ("durationMinutes" BETWEEN 0 AND 1440);