"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { upload } from "@vercel/blob/client";
import { Film, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { saveGameVideo, deleteGameVideo, setGameVideoDuration } from "@/lib/actions/games";

interface ExistingVideo {
  url: string;
  filename: string;
  fileSizeBytes: number;
  durationSeconds: number | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Duration unknown";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/**
 * Game video upload — Stage 1 of the video-analysis feature. Uploads go
 * straight from the browser to Vercel Blob (see upload() below and
 * app/api/games/[id]/video/upload/route.ts), never through this app's own
 * server, so a full-game MP4 never hits a serverless function's request
 * body limit. Requires the BLOB_READ_WRITE_TOKEN environment variable (a
 * Vercel Blob store, created from the Vercel project's Storage tab) — a
 * failed upload surfaces that setup requirement as the error message below
 * rather than failing silently.
 *
 * This component only uploads, stores, and plays back the video. It does
 * not analyze it — no events, players, or statistics are generated here.
 */
export function VideoUploadPanel({ gameId, video }: { gameId: string; video: ExistingVideo | null }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const durationReportedRef = useRef(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const looksLikeMp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
      if (!looksLikeMp4) {
        setError("Please upload an MP4 file.");
        return;
      }

      setUploading(true);
      setPendingName(file.name);
      setProgress(0);
      durationReportedRef.current = false;

      try {
        const blob = await upload(`games/${gameId}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: `/api/games/${gameId}/video/upload`,
          onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
        });
        const result = await saveGameVideo(gameId, {
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          fileSizeBytes: file.size,
        });
        if (!result.ok) setError(result.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setPendingName(null);
      }
    },
    [gameId]
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  async function handleRemove() {
    if (!confirm("Remove this game video? This cannot be undone.")) return;
    setError(null);
    const result = await deleteGameVideo(gameId);
    if (!result.ok) setError(result.error);
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="video/mp4,.mp4"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = "";
      }}
    />
  );

  if (video && !uploading) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden border border-border bg-black">
          <video
            src={video.url}
            controls
            preload="metadata"
            className="w-full max-h-[420px]"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (video.durationSeconds === null && Number.isFinite(d) && !durationReportedRef.current) {
                durationReportedRef.current = true;
                setGameVideoDuration(gameId, d);
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
              <Film className="h-4 w-4 text-muted shrink-0" strokeWidth={2} aria-hidden />
              {video.filename}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {formatDuration(video.durationSeconds)} · {formatFileSize(video.fileSizeBytes)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button variant="danger" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-negative">{error}</p>}
        {fileInput}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors",
          uploading ? "cursor-default border-border" : "cursor-pointer",
          !uploading && (dragActive ? "border-accent bg-accent/5" : "border-border hover:border-muted-2")
        )}
      >
        {uploading ? (
          <div className="space-y-3 max-w-sm mx-auto">
            <Upload className="h-8 w-8 mx-auto text-accent-strong animate-pulse" strokeWidth={1.5} aria-hidden />
            <p className="text-sm text-foreground font-medium truncate">{pendingName}</p>
            <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
              <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted">Uploading… {progress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-2" strokeWidth={1.5} aria-hidden />
            <p className="text-sm text-foreground font-medium">Drag and drop the game video here</p>
            <p className="text-xs text-muted">MP4 files · or click to browse</p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
      {fileInput}
    </div>
  );
}
