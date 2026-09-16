"use client";

import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { updatePlayerHeroImage } from "@/lib/actions/players";
import { resizeImageFile } from "@/lib/client-image-resize";
import { Button } from "@/components/ui/Button";
import { SIZE_CLASSES } from "@/components/players/PlayerPhoto";

const DEFAULT_FOCAL = 50;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Independent "background/card photo" editor, paired with PlayerPhotoUpload
 * (the headshot) but never touching it — separate preview, separate Save,
 * separate server action (updatePlayerHeroImage), separate DB column
 * (heroImageUrl). Reuses PlayerPhotoUpload's exact upload/resize/preview/
 * Save/Cancel/Remove pattern so the two controls feel like one system.
 *
 * A normal camera-roll photo (portrait or landscape) never needs pre-
 * cropping: object-fit: cover automatically scales and crops it to fill the
 * same rounded square every display site (this preview, the Players-tab
 * roster card, the Profile hero background) uses, without stretching. The
 * optional drag-to-reposition below only adjusts *which* part of the photo
 * that automatic crop centers on — it's a fine-tune, never required.
 */
export function PlayerBackgroundPhotoUpload({
  playerId,
  heroImageUrl,
  heroImageFocalX,
  heroImageFocalY,
}: {
  playerId: string;
  heroImageUrl: string | null;
  heroImageFocalX: number | null;
  heroImageFocalY: number | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [focalX, setFocalX] = useState(heroImageFocalX ?? DEFAULT_FOCAL);
  const [focalY, setFocalY] = useState(heroImageFocalY ?? DEFAULT_FOCAL);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; startFocalX: number; startFocalY: number } | null>(null);

  const displayed = preview ?? heroImageUrl;
  const savedFocalX = heroImageFocalX ?? DEFAULT_FOCAL;
  const savedFocalY = heroImageFocalY ?? DEFAULT_FOCAL;
  const dirty = preview !== null || focalX !== savedFocalX || focalY !== savedFocalY;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 15_000_000) {
      setError("That image is too large (max 15MB)");
      return;
    }
    setError(null);
    try {
      // Larger than the headshot's 480px cap — this photo fills a bigger
      // area (the roster card background, the profile hero banner).
      const dataUri = await resizeImageFile(file, 960, 0.85);
      setPreview(dataUri);
      setFocalX(DEFAULT_FOCAL);
      setFocalY(DEFAULT_FOCAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process that image");
    }
  }

  function handleSave() {
    if (!displayed) return;
    startTransition(async () => {
      const result = await updatePlayerHeroImage(playerId, displayed, focalX, focalY);
      if (result.ok) {
        setPreview(null);
      } else {
        setError(result.error);
      }
    });
  }

  function handleCancel() {
    setPreview(null);
    setFocalX(savedFocalX);
    setFocalY(savedFocalY);
    setError(null);
  }

  function handleRemove() {
    if (!confirm("Remove this player's background photo?")) return;
    startTransition(async () => {
      const result = await updatePlayerHeroImage(playerId, null, null, null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(null);
      setFocalX(DEFAULT_FOCAL);
      setFocalY(DEFAULT_FOCAL);
    });
  }

  function updateFocalFromDrag(clientX: number, clientY: number) {
    const box = previewBoxRef.current;
    const start = dragState.current;
    if (!box || !start) return;
    const rect = box.getBoundingClientRect();
    const dxPct = ((clientX - start.startX) / rect.width) * 100;
    const dyPct = ((clientY - start.startY) / rect.height) * 100;
    // Dragging the photo right/down reveals more of its left/top side —
    // i.e. the focal point (object-position) moves the opposite way.
    setFocalX(clamp(start.startFocalX - dxPct, 0, 100));
    setFocalY(clamp(start.startFocalY - dyPct, 0, 100));
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!displayed) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, startFocalX: focalX, startFocalY: focalY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    updateFocalFromDrag(e.clientX, e.clientY);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        ref={previewBoxRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative rounded-xl overflow-hidden shrink-0 border border-black/10 bg-black/5 ${SIZE_CLASSES.lg} ${
          displayed ? "cursor-grab active:cursor-grabbing touch-none" : ""
        }`}
        title={displayed ? "Drag to reposition" : undefined}
      >
        {displayed ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URI, not an optimizable remote/local asset
          <img
            src={displayed}
            alt=""
            draggable={false}
            className="h-full w-full object-cover pointer-events-none select-none"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-center px-3">
            <p className="text-xs text-black/40">No background photo</p>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {dirty ? (
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handleSave} disabled={pending} className="!px-3 !py-1.5 text-xs">
            {pending ? "Saving…" : "Save Photo"}
          </Button>
          <Button type="button" variant="ghost" className="!px-3 !py-1.5 text-xs" disabled={pending} onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="!px-3 !py-1.5 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            Edit Background Photo
          </Button>
          {heroImageUrl && (
            <Button
              type="button"
              variant="ghost"
              className="!px-2 !py-1.5 text-xs text-negative"
              disabled={pending}
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
        </div>
      )}
      {displayed && !error && <p className="text-[11px] text-muted-2">Drag photo to reposition</p>}
      {error && <p className="text-xs text-negative text-center max-w-[13rem]">{error}</p>}
    </div>
  );
}
