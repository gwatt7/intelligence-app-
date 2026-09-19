"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveMiniGamePlayerStat, type ActionResult } from "@/lib/actions/mini-games";
import { StatLineFields } from "@/components/forms/StatLineFields";
import { Field, Select } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import type { RawStatLine } from "@/lib/stats";

const initialState: ActionResult = { ok: true };

export interface MiniGameOption {
  id: string;
  label: string;
}

/** Lets a coach log/edit this player's Mini Game stats right from their profile, instead of going to the Mini Games tab and finding them in that game's full roster list. Writes to the exact same saveMiniGamePlayerStat action the Mini Game detail page uses — same data, same validation, just a different entry point. */
export function PlayerMiniGameStatForm({
  playerId,
  isGoalie,
  isForward,
  miniGames,
  statsByMiniGame,
}: {
  playerId: string;
  isGoalie: boolean;
  isForward?: boolean;
  miniGames: MiniGameOption[];
  statsByMiniGame: Record<string, RawStatLine>;
}) {
  const [selectedId, setSelectedId] = useState(miniGames[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    return saveMiniGamePlayerStat(selectedId, playerId, formData);
  }, initialState);

  if (miniGames.length === 0) {
    return (
      <p className="text-sm text-muted">
        No Mini Games created yet.{" "}
        <Link href="/mini-games/new" className="text-accent-strong hover:underline">
          Create one
        </Link>{" "}
        to log stats here.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Mini Game" htmlFor="miniGameSelect">
        <Select id="miniGameSelect" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {miniGames.map((mg) => (
            <option key={mg.id} value={mg.id}>
              {mg.label}
              {statsByMiniGame[mg.id] ? " (already logged)" : ""}
            </option>
          ))}
        </Select>
      </Field>
      <StatLineFields key={selectedId} defaults={statsByMiniGame[selectedId]} isGoalie={isGoalie} isForward={isForward} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Mini Game Stats"}
        </Button>
        {state.ok === false && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
