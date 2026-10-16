export async function register() {
  await import("@/lib/env");

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/server/env");
  }
}
