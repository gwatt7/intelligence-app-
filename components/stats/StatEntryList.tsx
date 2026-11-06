"use client";

import { useActionState, useState } from "react";
import { StatLineFields } from "@/components/forms/StatLineFields";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { zoneEntryPct, zoneExitPct, savePct, formatPct, type RawStatLine } from "@/lib/stats";
import { formatIceTime } from "@/lib/situation-stats";
import type { ActionResult } from "@/lib/actions/team";
import { SituationStatForm } from "@/components/stats/SituationStatForm";
import { SITUATION_LABEL, type ProfileSituation, type Situation, type SituationLine } from "@/lib/situation-stats";
import { cn } from "@/lib/cn";
import { PlayerGameStatusSelector, type PlayerGameStatus } from "@/components/stats/PlayerGameStatusSelector";

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

/** Optional per-game Dressed/Scratched/Injured status (official Games only — Mini Games don't pass this). Absence of a player from statusByPlayer means Dressed. */
export interface AvailabilityEntry {
  statusByPlayer: Record<string, PlayerGameStatus>;
  onChange: (playerId: string, status: PlayerGameStatus) => Promise<ActionResult>;
}

const SITUATIONS: ProfileSituation[] = ["EVEN", "POWER_PLAY", "PENALTY_KILL"];

/** Shared "select a player, enter their stat line" UI for Mini Games and official Games — the save action is bound to the mini-game/game id by the caller and only needs a playerId + FormData. Purely presentational: it never mixes the two, since each caller binds its own action against its own separate table. */
export function StatEntryList({
  saveAction,
  players,
  statsByPlayer,
  situational,
  availability,
}: {
  saveAction: (playerId: string, formData: FormData) => Promise<ActionResult>;
  players: Player[];
  // timeOnIceSeconds is optional here because it only exists on GamePlayerStat
  // (official Games) — Mini Games (also a StatEntryList caller) never set it.
  statsByPlayer: Map<string, RawStatLine & { timeOnIceSeconds?: number }>;
  situational?: SituationalEntry;
  availability?: AvailabilityEntry;
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
          status={availability?.statusByPlayer[p.id] ?? "DRESSED"}
          onStatusChange={availability ? (status) => availability.onChange(p.id, status) : undefined}
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
  status,
  onStatusChange,
  open,
  onToggle,
}: {
  saveAction: (playerId: string, formData: FormData) => Promise<ActionResult>;
  player: Player;
  stat?: RawStatLine & { timeOnIceSeconds?: number };
  situational?: SituationalEntry;
  status: PlayerGameStatus;
  onStatusChange?: (status: PlayerGameStatus) => Promise<ActionResult>;
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

  const unavailable = status !== "DRESSED";

  return (
    <div className="bg-surface">
      <div className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-raised">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
          <span className={cn("text-sm font-medium truncate", unavailable ? "text-muted-2" : "text-foreground")}>
            #{player.jerseyNumber} {player.firstName} {player.lastName}
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
            {unavailable ? (
              <Badge tone={status === "INJURED" ? "negative" : "neutral"}>{status === "INJURED" ? "Injured" : "Scratched"}</Badge>
            ) : hasStats ? (
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
                {!!situational && !!stat!.timeOnIceSeconds && <span>TOI {formatIceTime(stat!.timeOnIceSeconds)}</span>}
                <Badge tone="positive">Logged</Badge>
              </>
            ) : (
              <Badge tone="neutral">No stats</Badge>
            )}
            {!unavailable && showSituations && situationStats.POWER_PLAY && <Badge tone="accent">PP</Badge>}
            {!unavailable && showSituations && situationStats.PENALTY_KILL && <Badge tone="accent">PK</Badge>}
            <span>{open ? "▲" : "▼"}</span>
          </span>
        </button>
        {onStatusChange && <PlayerGameStatusSelector status={status} onChange={onStatusChange} />}
      </div>
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
          <StatLineFields
            defaults={stat}
            isGoalie={player.position === "GOALIE"}
            isForward={player.position === "FORWARD"}
            showIceTime={!!situational}
            iceTimeSeconds={stat?.timeOnIceSeconds}
          />
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
