import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { gameMatchupLabel } from "@/lib/game-display";
import { flatPanel } from "@/components/dashboard/dashboardCardStyles";

interface GameLite {
  opponent: string;
  date: Date;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  ourScore: number | null;
  opponentScore: number | null;
}

/** Bright, celebratory result-badge colors — win/loss only, driven entirely
 * by the real `result` prop (see app/page.tsx: derived from the most recent
 * completed official Game's ourScore/opponentScore, Mini Games never enter
 * into it). A tie or no completed game keeps the card in its plain neutral
 * state. */
const RESULT_STYLE = {
  W: { bg: "var(--result-win-bg)", color: "var(--result-win)", glow: "var(--result-win-glow)" },
  L: { bg: "var(--result-loss-bg)", color: "var(--result-loss)", glow: "var(--result-loss-glow)" },
} as const;

/** Dashboard-only "Last Game" card — real result only; never invents a
 * score. A flat card, same as its siblings — the win/loss pill badge is the
 * only accent, per the reference. */
export function LastGameCard({ game, result }: { game: GameLite | null; result: "W" | "L" | "T" | null }) {
  const resultStyle = result === "W" || result === "L" ? RESULT_STYLE[result] : null;

  return (
    <div className={`${flatPanel} p-5 min-h-[250px] flex flex-col`}>
      <div className="relative flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-foreground">Last Game</h3>
        {result &&
          (resultStyle ? (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ backgroundColor: resultStyle.bg, color: resultStyle.color, boxShadow: `0 0 12px -2px ${resultStyle.glow}` }}
            >
              {result === "W" ? "Win" : "Loss"}
            </span>
          ) : (
            <Badge tone="neutral">TIE</Badge>
          ))}
      </div>

      {game ? (
        <div className="relative mt-3 flex-1 flex flex-col justify-between">
          <p className="text-sm font-semibold text-foreground truncate">{gameMatchupLabel(game)}</p>

          <div>
            <p className="text-3xl font-bold font-mono text-foreground">
              {game.ourScore}
              <span className="text-muted-2 mx-1">-</span>
              {game.opponentScore}
            </p>
            <p className="mt-1 text-xs text-muted">{format(game.date, "EEE, MMM d")} · Final</p>
          </div>
        </div>
      ) : (
        <p className="relative mt-3 text-sm text-muted">No games completed yet.</p>
      )}
    </div>
  );
}
