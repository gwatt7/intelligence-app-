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
