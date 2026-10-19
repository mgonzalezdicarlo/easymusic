import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hanonExercises } from "./data/hanon-exercises";
import { scaleCatalog } from "./data/scale-catalog";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Every tonic in every mode (see docs/scale-catalog.md). Upserting by the natural key
// (tonic, mode) makes the seed idempotent. Existing rows are left untouched.
async function seedScaleCatalog() {
  await prisma.$transaction(
    scaleCatalog.map(({ tonic, mode }) =>
      prisma.scale.upsert({
        where: { tonic_mode: { tonic, mode } },
        update: {},
        create: { tonic, mode },
      }),
    ),
  );
}

// Hanon exercises 1-60. See docs/exercise-catalog.md.
async function seedHanonCatalog() {
  for (const { number, title } of hanonExercises) {
    // Catalog rows have no owner, so their (source, number) key is guarded by a partial unique
    // index that Prisma cannot target. A stable id derived from the key makes the upsert idempotent.
    const id = `hanon-${number}`;

    await prisma.exercise.upsert({
      where: { id },
      update: { title },
      create: { id, source: "HANON", number, title },
    });
  }
}

// Fails the seed unless the database holds exactly the expected catalog, so a duplicate or
// stray row is caught as soon as it appears, locally and in CI.
async function verifyCatalog() {
  const [scales, hanon] = await Promise.all([
    prisma.scale.count(),
    prisma.exercise.count({ where: { source: "HANON", ownerId: null } }),
  ]);

  if (scales !== scaleCatalog.length || hanon !== hanonExercises.length) {
    throw new Error(
      `Catalog check failed: expected ${scaleCatalog.length} scales and ` +
        `${hanonExercises.length} Hanon exercises, found ${scales} and ${hanon}.`,
    );
  }

  return { scales, hanon };
}

async function main() {
  const userCount = await prisma.user.count();

  await seedScaleCatalog();
  await seedHanonCatalog();
  const counts = await verifyCatalog();

  console.log(`Seed: database connection OK (${userCount} users).`);
  console.log(`Seed: scale catalog holds ${counts.scales} scales.`);
  console.log(`Seed: Hanon catalog holds ${counts.hanon} exercises.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
