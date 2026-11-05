import Link from "next/link";
import { format } from "date-fns";
import { gameMatchupLabel } from "@/lib/game-display";
import { CardHeader, SoftIconTile, display, panel, shortOpponent } from "@/components/dashboard/dashboardUi";

interface GameLite {
  id: string;
  opponent: string;
  date: Date;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  ourScore: number | null;
  opponentScore: number | null;
}

/** Crossed hockey sticks. */
export function SticksIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className} aria-hidden>
      <path d="M6 4l8 14.5M18 4l-8 14.5M7.5 19.5h4M12.5 19.5h4" />
    </svg>
  );
}

const RESULT = {
  W: { label: "Win", bg: "#dcfce7", fg: "#15803d" },
  L: { label: "Loss", bg: "#fee2e2", fg: "#b91c1c" },
  T: { label: "Tie", bg: "#f3f4f6", fg: "#4b5563" },
} as const;

/** "Last Game" card — the most recent completed official game's real result; never invents a score. */
export function LastGameCard({
  game,
  result,
  nextOpponent,
}: {
  game: GameLite | null;
  result: "W" | "L" | "T" | null;
  nextOpponent: string | null;
}) {
  return (
    <section className={panel}>
      <CardHeader
        title="Last Game"
        action={
          <Link href="/games" className="text-[13px] font-semibold text-[#5b626b] hover:text-[#0d1116]">
            Results
          </Link>
        }
      />
      {game ? (
        <Link href={`/games/${game.id}`} className="flex items-center gap-[14px] px-[18px] py-[18px] hover:bg-[#fafafa]">
          <SoftIconTile>
            <SticksIcon className="h-[18px] w-[18px]" />
          </SoftIconTile>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#0d1116]">{gameMatchupLabel(game)}</p>
            <p className="text-[13px] text-[#5b626b]">{format(game.date, "EEE, MMM d")} · Final</p>
          </div>
          <div className="flex shrink-0 items-center gap-[10px]">
            {result && (
              <span
                className={`${display} rounded-[3px] px-[8px] py-[2px] text-[12px] font-bold uppercase tracking-[0.1em]`}
                style={{ background: RESULT[result].bg, color: RESULT[result].fg }}
              >
                {RESULT[result].label}
              </span>
            )}
            <span className={`${display} text-[28px] font-bold leading-none text-[#0d1116]`}>
              {game.ourScore}-{game.opponentScore}
            </span>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-[14px] px-[18px] py-[18px]">
          <SoftIconTile>
            <SticksIcon className="h-[18px] w-[18px]" />
          </SoftIconTile>
          <div>
            <p className="text-[15px] font-semibold text-[#0d1116]">No games played yet</p>
            <p className="text-[13px] text-[#5b626b]">
              {nextOpponent ? `Box score appears after the opener vs ${shortOpponent(nextOpponent)}.` : "Box score appears after the first game."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
