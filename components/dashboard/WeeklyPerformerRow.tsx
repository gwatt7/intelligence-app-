import Link from "next/link";
import { cn } from "@/lib/cn";
import type { WeeklyCandidate } from "@/lib/weekly-rankings";

export const MEDALS = ["🥇", "🥈", "🥉"];

export function WeeklyPerformerRow({
  candidate,
  medal,
  tone,
}: {
  candidate: WeeklyCandidate;
  medal?: string;
  tone: "top" | "bottom";
}) {
  return (
    <Link
      href={`/players/${candidate.playerId}`}
      className="block rounded-lg border border-border bg-surface-raised px-3 py-2.5 hover:border-muted-2 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium text-foreground text-sm truncate">
          {medal && <span className="text-base shrink-0">{medal}</span>}
          <span className="truncate">
            #{candidate.jerseyNumber} {candidate.name}
          </span>
        </span>
        <span
          className={cn(
            "text-sm font-mono font-semibold shrink-0",
            tone === "top" ? "text-positive" : "text-negative"
          )}
        >
          {candidate.performanceScore.toFixed(1)}
        </span>
      </div>
      {candidate.breakdown.length > 0 && (
        <p className="mt-1 text-xs text-muted truncate">{candidate.breakdown.map((b) => b.detail).join(" · ")}</p>
      )}
    </Link>
  );
}
