"use client";

import { useState } from "react";
import { PlayerForm } from "@/components/forms/PlayerForm";
import { Button } from "@/components/ui/Button";

/**
 * "+ Add Player" for the Players tab — reuses the exact same PlayerForm /
 * createPlayer action already used on the Team tab's roster table
 * (see RosterSection.tsx), so a player added here is stored, validated,
 * and rendered identically to one added from Team. No separate creation
 * path or data shape.
 */
export function AddPlayerButton({ seasonId }: { seasonId: string }) {
  const [adding, setAdding] = useState(false);

  if (!adding) {
    return (
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>+ Add Player</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <PlayerForm seasonId={seasonId} onDone={() => setAdding(false)} />
    </div>
  );
}
