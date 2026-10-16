import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "must be a PostgreSQL connection string starting with postgresql://",
    ),
});

function loadServerEnv() {
  const parsed = schema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
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
