import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  formatMiniGameChange,
  describeMiniGameChanges,
  type MiniGameProgressionSummary,
  type MiniGameStatChange,
} from "@/lib/mini-game-analytics";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";
import { flatPanel, accentSurface, AccentGlowCorner } from "@/components/dashboard/dashboardCardStyles";

const TONE = {
  positive: {
    border: "var(--positive-border)",
    glow: "var(--positive-glow)",
    fade: "var(--positive-fade)",
    color: "var(--positive)",
    iconBg: "bg-positive-bg",
  },
  negative: {
    border: "var(--negative-border)",
    glow: "var(--negative-glow)",
    fade: "var(--negative-fade)",
    color: "var(--negative)",
    iconBg: "bg-negative-bg",
  },
} as const;

/** One stat-change row: label, previous → current, and the change itself —
 * a real percentage when one is computable, or the absolute change only
 * when the previous value was zero (never a fabricated/invented percent). */
function ChangeRow({ change, color }: { change: MiniGameStatChange; color: string }) {
  const tag =
    change.progression.pct !== null
      ? `${change.progression.pct > 0 ? "+" : ""}${change.progression.pct.toFixed(0)}%`
      : `${change.current - change.previous > 0 ? "+" : ""}${change.current - change.previous}`;

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted truncate">{change.label}</span>
      <span className="font-mono text-foreground shrink-0">
        {change.previous} → {change.current}
        <span className="ml-1.5 font-semibold" style={{ color }}>
          {tag}
        </span>
      </span>
    </div>
  );
}

/**
 * Single-player spotlight card — the #1 ranked player from the existing
 * topProgressing/trendingDown arrays (lib/mini-game-analytics.ts). Shows
 * their real headshot, the specific stats that actually changed (previous
 * → current, with a real percentage or an honest absolute change), a
 * data-generated explanation of why they earned the ranking, and the exact
 * Mini Games being compared. No competing calculation — everything here is
 * exactly what lib/mini-game-analytics.ts already computed.
 */
function ProgressionSpotlight({
  icon,
  label,
  statusLabel,
  tone,
  player,
  changes,
  explanationDirection,
}: {
  icon: React.ReactNode;
  label: string;
  statusLabel: string;
  tone: "positive" | "negative";
  player: MiniGameProgressionSummary | undefined;
  changes: (p: MiniGameProgressionSummary) => MiniGameStatChange[];
  explanationDirection: "improved" | "declined";
}) {
  const t = TONE[tone];

  // The points headline badge only makes sense when it actually points the
  // same direction as this card — a player can land on "Trending Down" from
  // their defensive/goaltending stats alone while their points stayed flat
  // or even rose, and showing a contradictory "+200%" there would be
  // misleading rather than explanatory.
  const showHeadline =
    player &&
    ((tone === "positive" && (player.progression.type === "increase" || player.progression.type === "new")) ||
      (tone === "negative" && player.progression.type === "decrease"));

  const topChanges = player ? changes(player).slice(0, 3) : [];
  const explanation = player ? describeMiniGameChanges(changes(player), explanationDirection) : "";

  return (
    <div className={`${flatPanel} p-4 sm:p-5`} style={accentSurface(t.border, t.glow)}>
      <AccentGlowCorner glow={t.glow} fade={t.fade} />
      <div className="relative flex items-center gap-2 mb-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${t.iconBg}`} style={{ color: t.color }}>
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-2">{label}</p>
      </div>

      {player ? (
        <Link href={`/players/${player.playerId}`} className="relative block group">
          <div className="flex items-start gap-3">
            <PlayerPhoto
              photoUrl={player.photoUrl}
              size="xs"
              className="transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold text-foreground truncate">
                #{player.jerseyNumber} {player.name}
              </p>
              {showHeadline ? (
                <p className="text-base font-bold font-mono mt-0.5" style={{ color: t.color }}>
                  {formatMiniGameChange(player.progression, 0)}
                  <span className="text-[10px] font-sans font-medium text-muted-2 ml-1.5 uppercase tracking-wide">pts</span>
                </p>
              ) : (
                <p className="text-[11px] uppercase tracking-wide text-muted-2 mt-1">{statusLabel}</p>
              )}
            </div>
          </div>

          {topChanges.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border pt-3">
              {topChanges.map((c) => (
                <ChangeRow key={c.key} change={c} color={t.color} />
              ))}
            </div>
          )}

          {explanation && <p className="mt-3 text-xs text-muted leading-snug">{explanation}</p>}

          <p className="mt-2.5 text-[10px] uppercase tracking-wide text-muted-2">{player.comparisonLabel}</p>
        </Link>
      ) : (
        <p className="relative text-sm text-muted">
          No data yet — need at least 2 Mini Games per player to show progression.
        </p>
      )}
    </div>
  );
}

/** Mini Game only — ranked by how many tracked stats genuinely improved vs.
 * declined between a player's most recent Mini Game and the one before it
 * (see lib/mini-game-analytics.ts). Never reads Official Game data. */
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
        icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}
        label="Top Progressing Player"
        statusLabel="Improving"
        tone="positive"
        player={topProgressing[0]}
        changes={(p) => p.favorableChanges}
        explanationDirection="improved"
      />
      <ProgressionSpotlight
        icon={<TrendingDown className="h-4 w-4" strokeWidth={2} />}
        label="Trending Down"
        statusLabel="Trending Down"
        tone="negative"
        player={trendingDown[0]}
        changes={(p) => p.unfavorableChanges}
        explanationDirection="declined"
      />
    </div>
  );
}
