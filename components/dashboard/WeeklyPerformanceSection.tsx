import { WeeklyPerformerRow, MEDALS } from "@/components/dashboard/WeeklyPerformerRow";
import { HeadingLink, SectionHeading, display, panel } from "@/components/dashboard/dashboardUi";
import type { WeeklyRankingResult } from "@/lib/weekly-rankings";

/** Weekly Performance Rankings (Top 3 / Bottom 3 of the current week). Restyles
 * the surrounding frame only — WeeklyPerformerRow (shared with the Weekly
 * Rankings page) is rendered unchanged. */
export function WeeklyPerformanceSection({
  result,
  historyHref,
}: {
  result: WeeklyRankingResult | null;
  historyHref: string;
}) {
  const hasRankings = !!result && (result.top.length > 0 || result.bottom.length > 0);

  return (
    <section>
      <SectionHeading
        title={result ? `Week ${result.weekNumber} Rankings` : "Weekly Rankings"}
        action={<HeadingLink href={historyHref}>View full rankings →</HeadingLink>}
      />
      <div className={`${panel} px-[20px] py-[18px]`}>
        <p className="text-[13px] text-[#5b626b]">Official games only · auto-updates as stats are logged · archives every Sunday night</p>

        <div className="mt-[14px] border-t [--border:#eef0f2] pt-[14px]">
          {!hasRankings ? (
            <p className="text-[14px] text-[#5b626b]">
              {result && result.insufficientData.length > 0
                ? `Not enough data yet this week — ${result.insufficientData.length} player(s) below the ${result.minEntriesRequired}-entry minimum.`
                : "No official game stats logged yet this week."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className={`${display} mb-2 text-[13px] font-bold uppercase tracking-[0.14em] text-[#15803d]`}>🏆 Top Performers</p>
                <div className="space-y-2">
                  {result!.top.map((c, i) => (
                    <WeeklyPerformerRow key={c.playerId} candidate={c} medal={MEDALS[i]} tone="top" />
                  ))}
                </div>
              </div>
              <div>
                <p className={`${display} mb-2 text-[13px] font-bold uppercase tracking-[0.14em] text-[#b91c1c]`}>📉 Bottom Performers</p>
                <div className="space-y-2">
                  {result!.bottom.map((c) => (
                    <WeeklyPerformerRow key={c.playerId} candidate={c} tone="bottom" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && result.insufficientData.length > 0 && hasRankings && (
            <p className="mt-3 text-[12px] text-[#8a9099]">
              {result.insufficientData.length} player(s) have insufficient data this week (fewer than {result.minEntriesRequired} logged
              entries) and aren&apos;t ranked.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
