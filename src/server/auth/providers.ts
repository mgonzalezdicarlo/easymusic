import { serverEnv } from "@/server/env";

const { GITHUB_CLIENT_ID: clientId, GITHUB_CLIENT_SECRET: clientSecret } =
  serverEnv;

/** GitHub sign-in is enabled only when both credentials are configured. */
export const github =
  clientId && clientSecret ? { clientId, clientSecret } : null;
export const githubEnabled = github !== null;
