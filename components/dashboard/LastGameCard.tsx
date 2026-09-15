import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { gameMatchupLabel } from "@/lib/game-display";
import { glassPanel } from "@/components/dashboard/dashboardCardStyles";

interface GameLite {
  opponent: string;
  date: Date;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  ourScore: number | null;
  opponentScore: number | null;
}

/** Dashboard-only "Last Game" card — real result only; never invents a score. */
export function LastGameCard({ game, result }: { game: GameLite | null; result: "W" | "L" | "T" | null }) {
  return (
    <div className={`${glassPanel} p-5 min-h-[210px] flex flex-col`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-2">Last Game</p>
        {result && (
          <Badge tone={result === "W" ? "positive" : result === "L" ? "negative" : "neutral"}>
            {result === "W" ? "WIN" : result === "L" ? "LOSS" : "TIE"}
          </Badge>
        )}
      </div>

      {game ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground truncate">{gameMatchupLabel(game)}</p>
          <p className="mt-2 text-3xl font-bold font-mono text-foreground">
            {game.ourScore}<span className="text-muted-2 mx-1">-</span>{game.opponentScore}
          </p>
          <p className="text-xs text-muted mt-1">{format(game.date, "EEE, MMM d")} · Final</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No games completed yet.</p>
      )}
    </div>
  );
}
