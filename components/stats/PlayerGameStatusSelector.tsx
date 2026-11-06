"use client";

import { useTransition } from "react";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/actions/team";

export type PlayerGameStatus = "DRESSED" | "SCRATCHED" | "INJURED";

const OPTIONS: { value: PlayerGameStatus; label: string }[] = [
  { value: "DRESSED", label: "Dressed" },
  { value: "SCRATCHED", label: "Scratched" },
  { value: "INJURED", label: "Injured" },
];

const ACTIVE_CLASSES: Record<PlayerGameStatus, string> = {
  DRESSED: "bg-positive-bg text-positive border-positive/30",
  SCRATCHED: "bg-surface-raised text-muted border-border",
  INJURED: "bg-negative-bg text-negative border-negative/30",
};

/**
 * Per-game availability — Dressed / Scratched / Injured. Separate from (and
 * never confused with) Player.status, which is a season-long roster field
 * (Active/Injured/Unavailable) shown via StatusBadge elsewhere. This status
 * is specific to one game: changing it here never touches any other game,
 * and never deletes the player's entered stats for this game — it only
 * governs whether those stats are counted (see lib/player-availability.ts).
 */
export function PlayerGameStatusSelector({
  status,
  onChange,
}: {
  status: PlayerGameStatus;
  onChange: (status: PlayerGameStatus) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label="Game status"
      className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={status === opt.value}
          disabled={pending}
          onClick={() => {
            if (opt.value === status) return;
            startTransition(() => {
              onChange(opt.value);
            });
          }}
          className={cn(
            "rounded-md border px-2 py-1 font-medium transition-colors",
            status === opt.value ? ACTIVE_CLASSES[opt.value] : "border-transparent text-muted-2 hover:text-foreground",
            pending && "opacity-60"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
