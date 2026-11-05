// Issues short-lived client upload tokens for Vercel Blob so the browser can
// stream a full-game MP4 directly to Blob storage, bypassing the serverless
// function's request body-size limit entirely — the file never passes
// through this route. Requires BLOB_READ_WRITE_TOKEN to be set (see
// VideoUploadPanel's doc comment for setup).
//
// The actual GameVideo database row is NOT written here. Vercel's
// onUploadCompleted webhook only reaches a deployment that's publicly
// reachable from Vercel's infrastructure (never local dev), so instead the
// client calls the saveGameVideo server action itself immediately after
// upload() resolves, which is simpler and works identically in every
// environment. onUploadCompleted is left a no-op for that reason.
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Force Node.js (never Edge) so there's no ambiguity about which runtime
// this route executes on while diagnosing why BLOB_READ_WRITE_TOKEN isn't
// reaching it.
export const runtime = "nodejs";

/** Temporary diagnostic — visit this route's URL directly in a browser
 * (GET, not the POST the upload flow uses) to see, without digging through
 * Vercel's dashboard, whether BLOB_READ_WRITE_TOKEN is actually visible to
 * this exact running deployment. Never returns the token itself — only
 * whether it's set, its length, and its first few characters (enough to
 * confirm it looks like a real Blob token, e.g. "vercel_blob_rw_...",
 * without exposing anything secret). Safe to remove once the integration
 * is confirmed working. */
export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;
  return NextResponse.json({
    BLOB_READ_WRITE_TOKEN_present: Boolean(token),
    BLOB_READ_WRITE_TOKEN_length: token?.length ?? 0,
    BLOB_READ_WRITE_TOKEN_prefix: token ? token.slice(0, 20) : null,
    BLOB_STORE_ID_present: Boolean(storeId),
    BLOB_STORE_ID: storeId ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/mp4"],
        addRandomSuffix: true,
        maximumSizeInBytes: 5 * 1024 * 1024 * 1024, // 5 GB — generous ceiling for a full game recording
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    // @vercel/blob/client's upload() discards this response body on any
    // non-2xx status and shows a fixed generic message in the browser (see
    // VideoUploadPanel's describeUploadError) — this log is the only place
    // the real reason (almost always a missing/invalid
    // BLOB_READ_WRITE_TOKEN) is visible. Check this route's logs in the
    // Vercel dashboard (or the terminal in local dev) when uploads fail.
    console.error("[video-upload] token request failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload token request failed" }, { status: 400 });
  }
}
