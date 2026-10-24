import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "@/lib/auth/session";

// Sign-in for the UWS Men's Hockey workspace is configured with environment
// variables (see .env.example). There is no default username or password:
// if any variable is missing, sign-in stays disabled.

const REQUIRED_VARS = ["NORTHSTAR_LOGIN_USERNAME", "NORTHSTAR_LOGIN_PASSWORD", "NORTHSTAR_SESSION_SECRET"] as const;

/** Names of auth environment variables that are missing or invalid. Empty means sign-in is configured. */
export function missingAuthConfig(): string[] {
  const missing: string[] = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (process.env.NORTHSTAR_SESSION_SECRET && !getSessionSecret()) {
    missing.push("NORTHSTAR_SESSION_SECRET (must be at least 32 characters)");
  }
  return missing;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time string comparison (hashing first makes lengths equal). */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/** Returns the canonical username if the credentials match, otherwise null. */
export function checkCredentials(identifier: string, password: string): string | null {
  const expectedUser = process.env.NORTHSTAR_LOGIN_USERNAME;
  const expectedPassword = process.env.NORTHSTAR_LOGIN_PASSWORD;
  if (!expectedUser || !expectedPassword || !getSessionSecret()) return null;

  // Usernames/emails are compared case-insensitively; passwords exactly.
  // Both comparisons always run so timing doesn't reveal which one failed.
  const userOk = safeEqual(identifier.trim().toLowerCase(), expectedUser.trim().toLowerCase());
  const passwordOk = safeEqual(password, expectedPassword);
  return userOk && passwordOk ? expectedUser.trim() : null;
}
