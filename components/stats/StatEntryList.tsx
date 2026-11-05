"use client";

import { useActionState, useState } from "react";
import { StatLineFields } from "@/components/forms/StatLineFields";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { zoneEntryPct, zoneExitPct, savePct, formatPct, type RawStatLine } from "@/lib/stats";
import type { ActionResult } from "@/lib/actions/team";
import { SituationStatForm } from "@/components/stats/SituationStatForm";
import { SITUATION_LABEL, type ProfileSituation, type Situation, type SituationLine } from "@/lib/situation-stats";
import { cn } from "@/lib/cn";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
};

const initialState: ActionResult = { ok: true };

/** Optional Power Play / Penalty Kill entry (official Games only — Mini Games don't pass this). */
export interface SituationalEntry {
  save: (playerId: string, situation: Situation, formData: FormData) => Promise<ActionResult>;
  clear: (playerId: string, situation: Situation) => Promise<ActionResult>;
  statsByPlayer: Record<string, Partial<Record<Situation, SituationLine>>>;
}

const SITUATIONS: ProfileSituation[] = ["EVEN", "POWER_PLAY", "PENALTY_KILL"];

/** Shared "select a player, enter their stat line" UI for Mini Games and official Games — the save action is bound to the mini-game/game id by the caller and only needs a playerId + FormData. Purely presentational: it never mixes the two, since each caller binds its own action against its own separate table. */
export function StatEntryList({
  saveAction,
  players,
  statsByPlayer,
  situational,
}: {
  saveAction: (playerId: string, formData: FormData) => Promise<ActionResult>;
  players: Player[];
  statsByPlayer: Map<string, RawStatLine>;
  situational?: SituationalEntry;
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
          situational={situational}
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
  situational,
  open,
  onToggle,
}: {
  saveAction: (playerId: string, formData: FormData) => Promise<ActionResult>;
  player: Player;
  stat?: RawStatLine;
  situational?: SituationalEntry;
  open: boolean;
  onToggle: () => void;
}) {
  // PP/PK entry is for skaters in official games only.
  const showSituations = !!situational && player.position !== "GOALIE";
  const situationStats = situational?.statsByPlayer[player.id] ?? {};
  const [situation, setSituation] = useState<ProfileSituation>("EVEN");
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
              {player.position === "GOALIE" ? (
                <>
                  <span>Saves {stat!.saves}</span>
                  <span>Save% {formatPct(savePct(stat!))}</span>
                </>
              ) : (
                <>
                  <span>Entry {formatPct(zoneEntryPct(stat!))}</span>
                  <span>Exit {formatPct(zoneExitPct(stat!))}</span>
                </>
              )}
              <Badge tone="positive">Logged</Badge>
            </>
          ) : (
            <Badge tone="neutral">No stats</Badge>
          )}
          {showSituations && situationStats.POWER_PLAY && <Badge tone="accent">PP</Badge>}
          {showSituations && situationStats.PENALTY_KILL && <Badge tone="accent">PK</Badge>}
          <span>{open ? "▲" : "▼"}</span>
        </span>
      </button>
      {open && showSituations && (
        <div className="px-4 pb-3">
          <div role="tablist" aria-label="Game situation" className="inline-flex rounded-lg border border-border bg-surface-raised p-1">
            {SITUATIONS.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={situation === s}
                onClick={() => setSituation(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  situation === s ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"
                )}
              >
                {SITUATION_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && showSituations && (
        <>
          {(["POWER_PLAY", "PENALTY_KILL"] as const).map((s) => (
            <div key={s} hidden={situation !== s} className="px-4 pb-4">
              <SituationStatForm
                situation={s}
                stat={situationStats[s]}
                save={(sit, fd) => situational!.save(player.id, sit, fd)}
                clear={(sit) => situational!.clear(player.id, sit)}
              />
            </div>
          ))}
        </>
      )}
      {open && (
        <form action={formAction} hidden={showSituations && situation !== "EVEN"} className="px-4 pb-4">
          <StatLineFields defaults={stat} isGoalie={player.position === "GOALIE"} isForward={player.position === "FORWARD"} />
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
