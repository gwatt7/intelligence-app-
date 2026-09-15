import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge, TrendBadge } from "@/components/ui/Badge";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";

const POSITION_LABEL = { FORWARD: "Forward", DEFENSE: "Defense", GOALIE: "Goalie" } as const;

interface CardPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  status: "ACTIVE" | "INJURED" | "UNAVAILABLE";
  photoUrl: string | null;
}

/**
 * Visual roster card — photo, jersey #, name, position/status, and the same
 * Performance Index / Recent Trend figures the old table showed, sourced
 * from the identical player-analytics data (no separate computation).
 */
export function PlayerCard({
  player,
  index,
  trend,
}: {
  player: CardPlayer;
  index: number | null;
  trend: number | null;
}) {
  return (
    <Link href={`/players/${player.id}`}>
      <Card className="hover:border-accent/50 transition-colors h-full flex flex-col items-center text-center gap-3">
        <div className="relative">
          <PlayerPhoto photoUrl={player.photoUrl} size="md" variant="boxed" />
          <span className="absolute top-1.5 left-1.5 rounded-md bg-background/80 border border-border px-1.5 py-0.5 text-xs font-mono text-muted">
            #{player.jerseyNumber}
          </span>
        </div>

        <div className="min-w-0 w-full">
          <p className="font-semibold text-foreground truncate">
            {player.firstName} {player.lastName}
          </p>
          <p className="text-xs text-muted mt-0.5">{POSITION_LABEL[player.position]}</p>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <StatusBadge status={player.status} />
        </div>

        <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-2">Perf. Index</p>
            <p className="text-lg font-bold text-foreground">{index ? index.toFixed(1) : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-2 mb-1">Trend</p>
            <TrendBadge value={trend} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
