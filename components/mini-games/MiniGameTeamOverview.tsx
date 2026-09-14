import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatMiniGameChange, type MiniGameProgressionSummary } from "@/lib/mini-game-analytics";
import { cn } from "@/lib/cn";

function OverviewList({
  title,
  tone,
  players,
}: {
  title: string;
  tone: "positive" | "negative";
  players: MiniGameProgressionSummary[];
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {players.length === 0 ? (
        <p className="text-sm text-muted">No data yet — need at least 2 Mini Games per player to show progression.</p>
      ) : (
        <ol className="space-y-2">
          {players.map((p, i) => (
            <li key={p.playerId}>
              <Link
                href={`/players/${p.playerId}`}
                className="flex items-center justify-between gap-2 text-sm hover:text-accent-strong"
              >
                <span className="text-foreground truncate">
                  <span className="text-muted-2 mr-1.5">{i + 1}.</span>#{p.jerseyNumber} {p.name}
                </span>
                <span className={cn("font-mono shrink-0", tone === "positive" ? "text-positive" : "text-negative")}>
                  {formatMiniGameChange(p.progression)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
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
      <OverviewList title="🔼 Top Progressing Players" tone="positive" players={topProgressing} />
      <OverviewList title="🔽 Players Trending Down" tone="negative" players={trendingDown} />
    </div>
  );
}
