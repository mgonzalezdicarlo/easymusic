import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hanonExercises } from "./data/hanon-exercises";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Reference sample of the Hanon catalog. The full 1-60 set arrives in E2-05; see
// docs/exercise-catalog.md for how to add exercises.
async function seedHanonSample() {
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

  return hanonExercises.length;
}

async function main() {
  const userCount = await prisma.user.count();
  const hanonCount = await seedHanonSample();

  console.log(`Seed: database connection OK (${userCount} users).`);
  console.log(`Seed: ${hanonCount} sample Hanon exercises upserted.`);
  console.log("Seed: the full scale and Hanon catalogs arrive in E2-05.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
