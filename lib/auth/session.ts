// Signed session cookie for the UWS Men's Hockey workspace.
//
// Uses Web Crypto only (no Node-specific APIs), so the same code runs in
// proxy.ts, route handlers, layouts and server actions.
//
// Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)

export const SESSION_COOKIE = "northstar_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type Session = {
  /** The username/email the user signed in with. */
  sub: string;
  /** Expiry, in seconds since epoch. */
  exp: number;
};

const MIN_SECRET_LENGTH = 32;

/** Returns the signing secret, or null if it is missing or too short (fail closed). */
export function getSessionSecret(): string | null {
  const secret = process.env.NORTHSTAR_SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;
  return secret;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createSessionToken(sub: string, secret: string): Promise<string> {
  const payload: Session = { sub, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the session if the token is authentic and unexpired, otherwise null. */
export async function verifySessionToken(token: string | undefined, secret: string | null): Promise<Session | null> {
  if (!token || !secret) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64Url(signature), encoder.encode(body));
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(fromBase64Url(body))) as Partial<Session>;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

/**
 * Only allow redirects back to a path on this site (e.g. "/players/123"),
 * never to another domain ("//evil.com", "https://...").
 */
export function safeNextPath(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  if (next === "/" || next.startsWith("/login") || next.startsWith("/api/")) return fallback;
  return next;
}
