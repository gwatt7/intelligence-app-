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

/** Bright, celebratory result colors — win/loss only, driven entirely by the
 * real `result` prop (see app/page.tsx: derived from the most recent
 * completed official Game's ourScore/opponentScore, Mini Games never enter
 * into it). A tie or no completed game keeps the card in its plain neutral
 * state. */
const RESULT_STYLE = {
  W: { border: "var(--result-win-border)", glow: "var(--result-win-glow)", bg: "var(--result-win-bg)", color: "var(--result-win)" },
  L: { border: "var(--result-loss-border)", glow: "var(--result-loss-glow)", bg: "var(--result-loss-bg)", color: "var(--result-loss)" },
} as const;

/** Dashboard-only "Last Game" card — real result only; never invents a score. */
export function LastGameCard({ game, result }: { game: GameLite | null; result: "W" | "L" | "T" | null }) {
  const resultStyle = result === "W" || result === "L" ? RESULT_STYLE[result] : null;

  return (
    <div
      className={`${glassPanel} p-5 min-h-[250px] flex flex-col`}
      style={
        resultStyle
          ? {
              borderColor: resultStyle.border,
              boxShadow: `0 0 30px -6px ${resultStyle.glow}`,
              backgroundImage: `linear-gradient(180deg, ${resultStyle.bg}, transparent 60%)`,
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-2">Last Game</p>
        {result &&
          (resultStyle ? (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ backgroundColor: resultStyle.bg, color: resultStyle.color, boxShadow: `0 0 16px -2px ${resultStyle.glow}` }}
            >
              {result === "W" ? "Win" : "Loss"}
            </span>
          ) : (
            <Badge tone="neutral">TIE</Badge>
          ))}
      </div>

      {game ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground truncate">{gameMatchupLabel(game)}</p>
          <p
            className="mt-2 text-3xl font-bold font-mono"
            style={resultStyle ? { color: resultStyle.color, textShadow: `0 0 18px ${resultStyle.glow}` } : { color: "var(--foreground)" }}
          >
            {game.ourScore}
            <span className={resultStyle ? "mx-1" : "text-muted-2 mx-1"} style={resultStyle ? { color: resultStyle.color, opacity: 0.6 } : undefined}>
              -
            </span>
            {game.opponentScore}
          </p>
          <p className="text-xs text-muted mt-1">{format(game.date, "EEE, MMM d")} · Final</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No games completed yet.</p>
      )}
    </div>
  );
}
