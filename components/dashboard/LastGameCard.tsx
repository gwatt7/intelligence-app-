import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { gameMatchupLabel } from "@/lib/game-display";
import { glassPanel, accentSurface, AccentGlowCorner } from "@/components/dashboard/dashboardCardStyles";
import { OpponentLogo } from "@/components/games/OpponentLogo";

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
  W: {
    border: "var(--result-win-border)",
    glow: "var(--result-win-glow)",
    fade: "var(--result-win-fade)",
    bg: "var(--result-win-bg)",
    color: "var(--result-win)",
  },
  L: {
    border: "var(--result-loss-border)",
    glow: "var(--result-loss-glow)",
    fade: "var(--result-loss-fade)",
    bg: "var(--result-loss-bg)",
    color: "var(--result-loss)",
  },
} as const;

/** Dashboard-only "Last Game" card — real result only; never invents a score.
 * The opponent side shows that team's real logo when one has been supplied
 * (see lib/opponent-logos.ts via OpponentLogo), falling back to a text
 * monogram otherwise. */
export function LastGameCard({ game, result }: { game: GameLite | null; result: "W" | "L" | "T" | null }) {
  const resultStyle = result === "W" || result === "L" ? RESULT_STYLE[result] : null;

  return (
    <div
      className={`${glassPanel} p-5 min-h-[250px] flex flex-col`}
      style={
        resultStyle
          ? {
              ...accentSurface(resultStyle.border, resultStyle.glow),
              // Solid surface base UNDER the result glow — never just the
              // color on its own, so the card stays fully opaque regardless
              // of what's behind it on the page.
              backgroundImage: `linear-gradient(180deg, var(--surface-raised), var(--surface))`,
            }
          : undefined
      }
    >
      {resultStyle && <AccentGlowCorner glow={resultStyle.glow} fade={resultStyle.fade} />}
      <div className="relative flex items-center justify-between gap-2">
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
        <div className="relative mt-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <OpponentLogo opponent={game.opponent} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{gameMatchupLabel(game)}</p>
              <p className="text-xs text-muted">{format(game.date, "EEE, MMM d")} · Final</p>
            </div>
          </div>

          <p
            className="mt-3 text-3xl font-bold font-mono"
            style={resultStyle ? { color: resultStyle.color, textShadow: `0 0 18px ${resultStyle.glow}` } : { color: "var(--foreground)" }}
          >
            {game.ourScore}
            <span className={resultStyle ? "mx-1" : "text-muted-2 mx-1"} style={resultStyle ? { color: resultStyle.color, opacity: 0.6 } : undefined}>
              -
            </span>
            {game.opponentScore}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No games completed yet.</p>
      )}
    </div>
  );
}
