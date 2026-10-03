import Link from "next/link";
import { format } from "date-fns";
import { Gamepad2 } from "lucide-react";
import { flatPanel } from "@/components/dashboard/dashboardCardStyles";

interface MiniGameLite {
  id: string;
  date: Date;
}

/** Dashboard-only "Next Mini Game" card — reads the same Mini Game schedule
 * data as the Mini Games tab; shows the existing empty state when none is
 * scheduled. */
export function NextMiniGameCard({ miniGame }: { miniGame: MiniGameLite | null }) {
  return (
    <div className={`${flatPanel} p-5 flex flex-col min-h-[250px]`}>
      <div
        aria-hidden
        className="pointer-events-none absolute right-5 bottom-5 h-24 w-24 rounded-2xl border border-border flex items-center justify-center"
      >
        <Gamepad2 strokeWidth={1.5} className="h-11 w-11 text-muted-2 opacity-60 select-none" />
      </div>
      <h3 className="relative text-xs font-semibold tracking-wide text-foreground">Next Mini Game</h3>

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
