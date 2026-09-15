import Link from "next/link";
import { format } from "date-fns";
import { glassPanel } from "@/components/dashboard/dashboardCardStyles";

interface MiniGameLite {
  id: string;
  date: Date;
}

/** Dashboard-only "Next Mini Game" card — reads the same Mini Game schedule data as the Mini Games tab; shows the existing empty state when none is scheduled. */
export function NextMiniGameCard({ miniGame }: { miniGame: MiniGameLite | null }) {
  return (
    <div className={`${glassPanel} p-5 flex flex-col min-h-[250px]`}>
      <span aria-hidden className="pointer-events-none absolute -right-3 -bottom-3 text-8xl opacity-[0.07] select-none">
        🎮
      </span>
      <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-muted-2">Next Mini Game</p>

      {miniGame ? (
        <Link
          href={`/mini-games/${miniGame.id}`}
          className="relative mt-3 text-sm font-semibold text-foreground hover:text-accent-strong transition-colors"
        >
          {format(miniGame.date, "MMM d, yyyy")}
        </Link>
      ) : (
        <p className="relative mt-3 text-sm text-muted">None scheduled</p>
      )}
    </div>
  );
}
