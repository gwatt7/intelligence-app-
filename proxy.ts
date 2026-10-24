import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getSessionSecret, verifySessionToken } from "@/lib/auth/session";

// Everything is protected except these public pages/endpoints.
// - "/"          Northstar landing page
// - "/login"     UWS Men's Hockey sign-in
// - "/api/auth"  sign-in / sign-out endpoints
// - "/api/cron"  Vercel cron, which has its own CRON_SECRET check
function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/cron/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, getSessionSecret());

  // Server actions are POSTs to a page path, so a public path could still be
  // used to call one. Block them all when signed out.
  if (!session && request.headers.has("next-action")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Already signed in: skip the login form.
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!session && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files in public/ (anything with a file extension).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
