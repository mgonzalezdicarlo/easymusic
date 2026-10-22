import { createAuthClient } from "better-auth/react";

// Same-origin client: requests go to /api/auth/*.
export const authClient = createAuthClient();
