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
    <div className={`${glassPanel} p-5 flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-2">Next Mini Game</p>
        <span className="text-lg shrink-0" aria-hidden>
          🎮
        </span>
      </div>

      {miniGame ? (
        <Link
          href={`/mini-games/${miniGame.id}`}
          className="mt-3 text-sm font-semibold text-foreground hover:text-accent-strong transition-colors"
        >
          {format(miniGame.date, "MMM d, yyyy")}
        </Link>
      ) : (
        <p className="mt-3 text-sm text-muted">None scheduled</p>
      )}
    </div>
  );
}
