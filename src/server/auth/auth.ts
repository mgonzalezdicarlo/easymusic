import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";
import { env } from "@/lib/env";
import { github } from "@/server/auth/providers";
import { prisma } from "@/server/db";
import { serverEnv } from "@/server/env";

const credentialLimit = { window: 60, max: 5 };

export const auth = betterAuth({
  appName: env.NEXT_PUBLIC_APP_NAME,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
  },
  socialProviders: github ? { github } : {},
  // Stored in PostgreSQL so limits hold across serverless instances.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": credentialLimit,
      "/sign-up/email": credentialLimit,
    },
  },
});
