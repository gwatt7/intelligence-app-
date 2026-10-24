import { NextResponse, type NextRequest } from "next/server";
import { checkCredentials, missingAuthConfig } from "@/lib/auth/credentials";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getSessionSecret,
  safeNextPath,
} from "@/lib/auth/session";

function backToLogin(request: NextRequest, error: string, next: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  if (next !== "/dashboard") url.searchParams.set("next", next);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  // Reject sign-in forms posted from other websites (login CSRF).
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "");
  const password = String(form.get("password") ?? "");
  const next = safeNextPath(form.get("next"));

  const secret = getSessionSecret();
  if (missingAuthConfig().length > 0 || !secret) {
    return backToLogin(request, "not-configured", next);
  }

  const username = identifier && password ? checkCredentials(identifier, password) : null;
  if (!username) {
    // Small fixed delay to slow down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return backToLogin(request, "invalid", next);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(SESSION_COOKIE, await createSessionToken(username, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
