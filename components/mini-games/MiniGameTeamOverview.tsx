import Link from "next/link";
import { formatMiniGameChange, type MiniGameProgressionSummary } from "@/lib/mini-game-analytics";
import { PlayerCutout } from "@/components/players/PlayerPhoto";
import { glassPanel, accentSurface } from "@/components/dashboard/dashboardCardStyles";

const TONE = {
  positive: {
    border: "var(--positive-border)",
    glow: "var(--positive-glow)",
    fade: "var(--positive-fade)",
    color: "var(--positive)",
  },
  negative: {
    border: "var(--negative-border)",
    glow: "var(--negative-glow)",
    fade: "var(--negative-fade)",
    color: "var(--negative)",
  },
} as const;

/**
 * Single-player spotlight card — the #1 ranked player from the existing
 * topProgressing/trendingDown arrays (lib/mini-game-analytics.ts), shown
 * with their real photo (or the same blank silhouette used everywhere else)
 * as a portrait cutout, and the same progression % the ranked list below
 * already computes. No competing calculation — this is presentation only.
 */
function ProgressionSpotlight({
  icon,
  label,
  statusLabel,
  tone,
  player,
}: {
  icon: string;
  label: string;
  statusLabel: string;
  tone: "positive" | "negative";
  player: MiniGameProgressionSummary | undefined;
}) {
  const t = TONE[tone];

  return (
    <div
      className={`${glassPanel} overflow-hidden`}
      style={accentSurface(t.border, t.glow, t.fade)}
    >
      <p className="relative px-4 sm:px-5 pt-4 sm:pt-5 text-xs font-semibold uppercase tracking-[0.15em] text-muted-2 flex items-center gap-1.5">
        <span aria-hidden>{icon}</span>
        {label}
      </p>

      {player ? (
        <Link href={`/players/${player.playerId}`} className="block group">
          <PlayerCutout
            photoUrl={player.photoUrl}
            className="h-36 sm:h-44 w-full mt-2 transition-transform duration-200 group-hover:scale-[1.03]"
          />
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-3 relative text-center">
            <p className="text-sm font-semibold text-foreground truncate">
              #{player.jerseyNumber} {player.name}
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono mt-0.5" style={{ color: t.color, textShadow: `0 0 18px ${t.glow}` }}>
              {formatMiniGameChange(player.progression, 1)}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-muted-2 mt-0.5">{statusLabel}</p>
          </div>
        </Link>
      ) : (
        <p className="px-4 sm:px-5 pt-2 pb-5 text-sm text-muted">
          No data yet — need at least 2 Mini Games per player to show progression.
        </p>
      )}
    </div>
  );
}

/** Mini Game only — ranked by % change in points (goals + assists) between a player's most recent Mini Game and the one before it. Never reads Official Game data. */
export function MiniGameTeamOverview({
  topProgressing,
  trendingDown,
}: {
  topProgressing: MiniGameProgressionSummary[];
  trendingDown: MiniGameProgressionSummary[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ProgressionSpotlight
        icon="🔼"
        label="Top Progressing Player"
        statusLabel="Improving"
        tone="positive"
        player={topProgressing[0]}
      />
      <ProgressionSpotlight
        icon="🔽"
        label="Trending Down"
        statusLabel="Trending Down"
        tone="negative"
        player={trendingDown[0]}
      />
    </div>
  );
}
