"use client";

import { useActionState, useState } from "react";
import { StatLineFields } from "@/components/forms/StatLineFields";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { zoneEntryPct, zoneExitPct, formatPct, type RawStatLine } from "@/lib/stats";
import type { ActionResult } from "@/lib/actions/team";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
};

const initialState: ActionResult = { ok: true };

/** Shared "select a player, enter their stat line" UI for both Practices and Games — the save action is bound to the practice/game id by the caller and only needs a playerId + FormData. */
export function StatEntryList({
  saveAction,
  players,
  statsByPlayer,
}: {
  saveAction: (playerId: string, formData: FormData) => Promise<ActionResult>;
  players: Player[];
  statsByPlayer: Map<string, RawStatLine>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {players.map((p) => (
        <PlayerRow
          key={p.id}
          saveAction={saveAction}
          player={p}
          stat={statsByPlayer.get(p.id)}
          open={openId === p.id}
          onToggle={() => setOpenId(openId === p.id ? null : p.id)}
        />
      ))}
    </div>
  );
}

function PlayerRow({
  saveAction,
  player,
  stat,
  open,
  onToggle,
}: {
  saveAction: (playerId: string, formData: FormData) => Promise<ActionResult>;
  player: Player;
  stat?: RawStatLine;
  open: boolean;
  onToggle: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    return saveAction(player.id, formData);
  }, initialState);

  const hasStats = !!stat;

  return (
    <div className="bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-raised"
      >
        <span className="text-sm font-medium text-foreground">
          #{player.jerseyNumber} {player.firstName} {player.lastName}
        </span>
        <span className="flex items-center gap-3 text-xs text-muted">
          {hasStats ? (
            <>
              <span>Entry {formatPct(zoneEntryPct(stat!))}</span>
              <span>Exit {formatPct(zoneExitPct(stat!))}</span>
              <Badge tone="positive">Logged</Badge>
            </>
          ) : (
            <Badge tone="neutral">No stats</Badge>
          )}
          <span>{open ? "▲" : "▼"}</span>
        </span>
      </button>
      {open && (
        <form action={formAction} className="px-4 pb-4">
          <StatLineFields defaults={stat} isGoalie={player.position === "GOALIE"} />
          <div className="flex items-center gap-3 mt-4">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save Stats"}
            </Button>
            {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
