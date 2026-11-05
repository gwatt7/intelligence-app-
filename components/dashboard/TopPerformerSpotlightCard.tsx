import Link from "next/link";
import { SnapshotCard } from "@/components/dashboard/SnapshotCard";
import { display } from "@/components/dashboard/dashboardUi";
import type { StatContribution } from "@/lib/stats";

/**
 * Performance Snapshot "Top Performer" cell.
 *
 * Shows the existing Performance-Index top performer for the current season
 * (lib/rankings.ts) with its top stat contribution. Until the current season
 * has official game data, it shows last season's points leader from the
 * report cards instead, labeled with that season — as in the design.
 */
export function TopPerformerSpotlightCard({
  current,
  fallback,
}: {
  current: { playerId: string; name: string; jerseyNumber: number; seasonLabel: string; contributions: StatContribution[] } | null;
  fallback: { playerId: string; name: string; jerseyNumber: number; seasonLabel: string; line: string } | null;
}) {
  const shown = current ?? fallback;
  const top = current?.contributions[0];

  return (
    <SnapshotCard label={`Top Performer${shown ? ` · ${shown.seasonLabel}` : ""}`}>
      {shown ? (
        <Link href={`/players/${shown.playerId}`} className="flex items-center gap-[14px] hover:opacity-85">
          <span
            className={`${display} flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#0a1019] text-[17px] font-bold text-[#f5b800]`}
          >
            {shown.jerseyNumber}
          </span>
          <span className="min-w-0">
            <span className={`${display} block truncate text-[23px] font-bold leading-none text-[#0d1116]`}>{shown.name}</span>
            <span className="mt-[5px] block truncate text-[13px] text-[#5b626b]">
              {current
                ? top
                  ? `↑ ${top.label} ${(top.progression.pct ?? 0).toFixed(1)}%`
                  : "Not enough data yet."
                : fallback!.line}
            </span>
          </span>
        </Link>
      ) : (
        <p className="text-[13px] text-[#5b626b]">No official game data yet.</p>
      )}
    </SnapshotCard>
  );
}
