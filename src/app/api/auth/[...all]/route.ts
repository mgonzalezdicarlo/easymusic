import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth/auth";

// Exception to docs/api-conventions.md: Better Auth builds its own responses and errors,
// so these handlers are not wrapped in apiHandler.
export const { GET, POST } = toNextJsHandler(auth);
