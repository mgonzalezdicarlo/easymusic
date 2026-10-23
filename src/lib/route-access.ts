// Pages that do not need a session. Every other page route is protected by `src/proxy.ts`,
// so a new route is private by default.
const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) =>
      pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}
