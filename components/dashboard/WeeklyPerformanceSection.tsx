import { ButtonLink } from "@/components/ui/Button";
import { WeeklyPerformerRow, MEDALS } from "@/components/dashboard/WeeklyPerformerRow";
import { glassPanel } from "@/components/dashboard/dashboardCardStyles";
import type { WeeklyRankingResult } from "@/lib/weekly-rankings";

/** Dashboard-only cinematic banner around the weekly rankings. Restyles the
 * surrounding chrome only — WeeklyPerformerRow (shared with the Weekly
 * Rankings page) is rendered completely unchanged. */
export function WeeklyPerformanceSection({
  result,
  historyHref,
}: {
  result: WeeklyRankingResult | null;
  historyHref: string;
}) {
  const hasRankings = !!result && (result.top.length > 0 || result.bottom.length > 0);

  return (
    <div className={`${glassPanel} p-5 sm:p-6`}>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-20 h-64 w-64 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, #fcd306, transparent 70%)" }}
      />
      <svg
        aria-hidden
        viewBox="0 0 200 160"
        className="pointer-events-none absolute -right-6 -bottom-8 h-32 w-40 sm:h-40 sm:w-48 opacity-[0.06]"
      >
        <g transform="rotate(-14 100 80)">
          <rect x="60" y="10" width="12" height="120" rx="5" fill="#f3f3ee" />
          <path d="M60 120 L72 120 L100 150 Q103 156 96 158 L60 158 Z" fill="#f3f3ee" />
        </g>
        <circle cx="145" cy="130" r="12" fill="#f3f3ee" />
      </svg>
      <div className="relative flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong flex items-center gap-1.5">
            <span aria-hidden>📅</span>
            {result ? `Week ${result.weekNumber} — Current` : "This Week's Performers"}
          </p>
          <p className="text-xs text-muted-2 mt-1">
            Official games only · auto-updates as stats are logged · archives every Sunday night
          </p>
        </div>
        <ButtonLink href={historyHref} variant="secondary" className="!px-3 !py-1.5 text-xs shrink-0">
          View Full Rankings
        </ButtonLink>
      </div>

      <div className="relative">
        {!hasRankings ? (
          <p className="text-sm text-muted flex items-center gap-1.5">
            <span aria-hidden>📅</span>
            {result && result.insufficientData.length > 0
              ? `Not enough data yet this week — ${result.insufficientData.length} player(s) below the ${result.minEntriesRequired}-entry minimum.`
              : "No official game stats logged yet this week."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-positive mb-2">🏆 Top Performers</p>
              <div className="space-y-2">
                {result!.top.map((c, i) => (
                  <WeeklyPerformerRow key={c.playerId} candidate={c} medal={MEDALS[i]} tone="top" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-negative mb-2">📉 Bottom Performers</p>
              <div className="space-y-2">
                {result!.bottom.map((c) => (
                  <WeeklyPerformerRow key={c.playerId} candidate={c} tone="bottom" />
                ))}
              </div>
            </div>
          </div>
        )}

        {result && result.insufficientData.length > 0 && hasRankings && (
          <p className="mt-3 text-xs text-muted-2">
            {result.insufficientData.length} player(s) have insufficient data this week (fewer than{" "}
            {result.minEntriesRequired} logged entries) and aren&apos;t ranked.
          </p>
        )}
      </div>
    </div>
  );
}
