import { execSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./src/generated/prisma/client";

// Creates the test database if it is missing and applies all migrations to it.
export default async function setup() {
  const databaseUrl = process.env.TEST_DATABASE_URL;

  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is not set.");

  const url = new URL(databaseUrl);
  const name = decodeURIComponent(url.pathname.slice(1));

  // The tests delete data, so never run them against a database that is not meant for it.
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run integration tests on "${name}": the database name must end with _test.`,
    );
  }

  url.pathname = "/postgres";

  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString() }),
  });

  try {
    const found = await admin.$queryRaw<
      { exists: boolean }[]
    >`SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${name}) AS "exists"`;

    if (!found[0]?.exists) {
      await admin.$executeRawUnsafe(
        `CREATE DATABASE "${name.replaceAll('"', '""')}"`,
      );
    }
  } finally {
    await admin.$disconnect();
  }

  execSync("npm run db:deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}
