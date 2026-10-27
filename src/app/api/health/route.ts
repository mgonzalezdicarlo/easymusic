import { connection, NextResponse } from "next/server";

import { prisma } from "@/server/db";

// Always evaluated at request time, never at build time.
//export const dynamic = "force-dynamic";

export async function GET() {
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: "ok", database: "up" });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 503 },
    );
  }
}
