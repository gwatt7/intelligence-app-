import Link from "next/link";
import { PlayerCutout } from "@/components/players/PlayerPhoto";
import { glassPanel, accentSurface } from "@/components/dashboard/dashboardCardStyles";
import type { StatContribution } from "@/lib/stats";

interface SpotlightPlayer {
  playerId: string;
  name: string;
  jerseyNumber: number;
  photoUrl: string | null;
}

/**
 * Dashboard "Top Performer" card — GOLD is this card's fixed identity
 * accent (never swapped for green/red); green is used only for each
 * individual contribution's ↑ indicator. Two instances of this same
 * component are used on the Dashboard — one fed Official-Game data, one
 * fed Mini-Game data — each with its own completely independent player
 * selection and contributions, computed by lib/player-analytics.ts and
 * lib/mini-game-analytics.ts respectively. This component itself has no
 * calculation logic of its own; it only renders what it's given.
 */
export function TopPerformerSpotlightCard({
  label,
  player,
  contributions,
  emptyMessage,
}: {
  label: string;
  player: SpotlightPlayer | null;
  contributions: StatContribution[];
  emptyMessage: string;
}) {
  return (
    <div
      className={`${glassPanel} p-4 sm:p-5 min-h-[220px]`}
      style={accentSurface("var(--accent-border)", "var(--accent-glow)", "var(--accent-fade)")}
    >
      {player && (
        <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-32">
          <PlayerCutout photoUrl={player.photoUrl} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/55 to-transparent" />
        </div>
      )}

      <div className="relative flex items-start gap-2 mb-3 pr-24 sm:pr-28">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm shrink-0 bg-accent/15 text-accent-strong border"
          style={{
            borderColor: "var(--accent-border)",
            boxShadow: "0 0 10px -1px var(--accent-glow), inset 0 0 6px -1px var(--accent-glow)",
          }}
        >
          🏆
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-2 leading-tight">{label}</p>
      </div>

      {player ? (
        <Link href={`/players/${player.playerId}`} className="relative block pr-24 sm:pr-28 hover:opacity-90 transition-opacity">
          <p className="text-base font-bold text-foreground truncate">
            #{player.jerseyNumber} {player.name}
          </p>

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-2 mb-1.5">Top Contributions</p>
            {contributions.length > 0 ? (
              <ul className="space-y-1">
                {contributions.map((c) => (
                  <li key={c.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted truncate">{c.label}</span>
                    <span className="font-mono font-semibold text-positive shrink-0">
                      ↑ {(c.progression.pct ?? 0).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">Not enough data yet to show top contributions.</p>
            )}
          </div>
        </Link>
      ) : (
        <p className="relative text-sm text-muted">{emptyMessage}</p>
      )}
    </div>
  );
}
