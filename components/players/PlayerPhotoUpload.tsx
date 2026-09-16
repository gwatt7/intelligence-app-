"use client";

import { useRef, useState, useTransition } from "react";
import { updatePlayerPhoto } from "@/lib/actions/players";
import { resizeImageFile } from "@/lib/client-image-resize";
import { Button } from "@/components/ui/Button";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";

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
      <PlayerPhoto photoUrl={displayed} size="lg" variant="flat" />

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
