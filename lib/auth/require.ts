import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, getSessionSecret, verifySessionToken, type Session } from "@/lib/auth/session";

/** The current signed-in session, or null. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, getSessionSecret());
}

/**
 * Use at the top of every protected layout and server action. proxy.ts
 * already blocks signed-out requests, but Next.js recommends checking
 * again here so a routing change can never silently expose data.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
