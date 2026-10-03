import Link from "next/link";
import { Users } from "lucide-react";
import { PlayerCutout } from "@/components/players/PlayerPhoto";
import { flatPanel } from "@/components/dashboard/dashboardCardStyles";
import type { StatContribution } from "@/lib/stats";

interface SpotlightPlayer {
  playerId: string;
  name: string;
  jerseyNumber: number;
  photoUrl: string | null;
}

/**
 * Dashboard "Top Performer" tile — sized and styled to sit in the same
 * Performance Snapshot row as Team Trend / Most Improved / Needs Attention,
 * per the reference. Two instances are used on the Dashboard — one fed
 * Official-Game data, one fed Mini-Game data — each with its own
 * independent player selection and contributions, computed by
 * lib/player-analytics.ts and lib/mini-game-analytics.ts respectively, and
 * each still shown (distinguished by `label`) so neither ranking is lost.
 * This component has no calculation logic of its own; it only renders the
 * single top contribution it's given.
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
  const topContribution = contributions[0];

  return (
    <div className={`${flatPanel} p-4 sm:p-5 min-h-[150px] flex flex-col`}>
      {player && (
        <div className="absolute right-0 top-0 bottom-0 w-14 sm:w-16">
          <PlayerCutout photoUrl={player.photoUrl} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/50 to-transparent" />
        </div>
      )}

      <div className="relative flex items-start gap-2 mb-3 pr-12 sm:pr-14">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-[color:var(--data-teal-bg)] text-[color:var(--data-teal)]">
          <Users className="h-4 w-4" strokeWidth={2} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-2 leading-tight pt-1">{label}</p>
      </div>

      {player ? (
        <Link
          href={`/players/${player.playerId}`}
          className="relative block pr-12 sm:pr-14 hover:opacity-90 transition-opacity"
        >
          <p className="text-base font-bold text-foreground truncate">
            #{player.jerseyNumber} {player.name}
          </p>
          {topContribution ? (
            <p className="text-xs text-positive font-mono mt-1">
              ↑ {topContribution.label} {(topContribution.progression.pct ?? 0).toFixed(1)}%
            </p>
          ) : (
            <p className="text-xs text-muted mt-1">Not enough data yet.</p>
          )}
        </Link>
      ) : (
        <p className="relative text-sm text-muted">{emptyMessage}</p>
      )}
    </div>
  );
}
