import { z } from "zod";

// Blank values (for example `GITHUB_CLIENT_ID=""` in .env.local) count as not set.
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const schema = z
  .object({
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (value) =>
          value.startsWith("postgresql://") || value.startsWith("postgres://"),
        "must be a PostgreSQL connection string starting with postgresql://",
      ),
    BETTER_AUTH_SECRET: z
      .string()
      .min(
        32,
        "must be at least 32 characters (see .env.example for how to generate one)",
      ),
    // Optional GitHub sign-in: set both values or neither.
    GITHUB_CLIENT_ID: optionalString,
    GITHUB_CLIENT_SECRET: optionalString,
  })
  .refine(
    (value) =>
      Boolean(value.GITHUB_CLIENT_ID) === Boolean(value.GITHUB_CLIENT_SECRET),
    {
      path: ["GITHUB_CLIENT_SECRET"],
      message: "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set together",
    },
  );

function loadServerEnv() {
  const parsed = schema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
      )
      .join("\n");

    throw new Error(
      `Invalid or missing server environment variables:\n${details}\n\n` +
        "Copy .env.example to .env.local and fill in the values.",
    );
  }

  return parsed.data;
}

// Server-only settings. Never import this module from a client component.
export const serverEnv = loadServerEnv();
export type ServerEnv = typeof serverEnv;
