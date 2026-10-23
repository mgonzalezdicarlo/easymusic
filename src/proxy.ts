import { type NextRequest, NextResponse } from "next/server";

import { isPublicPath } from "@/lib/route-access";
import { auth } from "@/server/auth/auth";

// Next.js 16 `proxy` (formerly `middleware`), see ADR-0004. It sends visitors without a valid
// session to the sign-in page. The session is checked against the database, so a deleted or
// expired session is rejected too. Data access still re-checks the session (`requireUser`).
export async function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();

  const session = await auth.api.getSession({ headers: request.headers });

  if (session) return NextResponse.next();

  return NextResponse.redirect(new URL("/sign-in", request.url));
}

export const config = {
  // Pages only. API routes answer 401 JSON themselves. Static files are skipped.
  matcher: ["/((?!api/|_next/static|_next/image|.*\\..*).*)"],
};
