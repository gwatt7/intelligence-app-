"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updatePlayerPhoto } from "@/lib/actions/players";
import { Button } from "@/components/ui/Button";

/** Resizes/compresses an image client-side before it's ever sent to the server — keeps the stored data: URI small (typically well under 200KB) regardless of the original file size. */
function resizeImageFile(file: File, maxDim = 480, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = document.createElement("img");
      img.onerror = () => reject(new Error("Could not load that image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image resizing isn't supported in this browser"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function PersonSilhouette() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-16 w-16 text-muted-2" aria-hidden>
      <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.6-9.8 4.9v2.7h19.6v-2.7c0-3.3-6.5-4.9-9.8-4.9z" />
    </svg>
  );
}

export function PlayerPhotoUpload({ playerId, photoUrl }: { playerId: string; photoUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const displayed = preview ?? photoUrl;

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
      const dataUri = await resizeImageFile(file);
      setPreview(dataUri);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process that image");
    }
  }

  function handleSave() {
    if (!preview) return;
    startTransition(async () => {
      const result = await updatePlayerPhoto(playerId, preview);
      if (result.ok) {
        setPreview(null);
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemove() {
    if (!confirm("Remove this player's profile picture?")) return;
    startTransition(async () => {
      const result = await updatePlayerPhoto(playerId, null);
      if (!result.ok) setError(result.error);
      setPreview(null);
    });
  }

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative h-36 w-36 sm:h-44 sm:w-44 rounded-xl border border-border bg-surface-raised overflow-hidden flex items-center justify-center">
        {/* Real UWS logo watermark behind the headshot — never a fabricated or stock image. */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] pointer-events-none">
          <Image src="/uws-logo.png" alt="" width={110} height={110} className="object-contain" />
        </div>
        {displayed ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URI, not an optimizable remote/local asset
          <img src={displayed} alt="" className="relative h-full w-full object-cover" />
        ) : (
          <div className="relative">
            <PersonSilhouette />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {preview ? (
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handleSave} disabled={pending} className="!px-3 !py-1.5 text-xs">
            {pending ? "Saving…" : "Save Photo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!px-3 !py-1.5 text-xs"
            disabled={pending}
            onClick={() => setPreview(null)}
          >
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
            Edit Player Profile Picture
          </Button>
          {photoUrl && (
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
      {error && <p className="text-xs text-negative text-center max-w-[11rem]">{error}</p>}
    </div>
  );
}
