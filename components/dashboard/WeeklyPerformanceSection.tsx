import Image from "next/image";
import { Calendar } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { WeeklyPerformerRow, MEDALS } from "@/components/dashboard/WeeklyPerformerRow";
import { flatPanel, accentSurface } from "@/components/dashboard/dashboardCardStyles";
import type { WeeklyRankingResult } from "@/lib/weekly-rankings";

/** Dashboard-only cinematic banner around the weekly rankings, using the
 * supplied rink/puck decorative photo. Restyles the surrounding chrome
 * only — WeeklyPerformerRow (shared with the Weekly Rankings page) is
 * rendered completely unchanged. */
export function WeeklyPerformanceSection({
  result,
  historyHref,
}: {
  result: WeeklyRankingResult | null;
  historyHref: string;
}) {
  const hasRankings = !!result && (result.top.length > 0 || result.bottom.length > 0);

  return (
    <div className={`${flatPanel} p-5 sm:p-6`} style={accentSurface("var(--accent-border)", "var(--accent-glow)")}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-2/3 sm:w-1/2 opacity-30"
        style={{
          maskImage: "linear-gradient(to left, black 45%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, black 45%, transparent 100%)",
        }}
      >
        <Image src="/dashboard/weekly-banner-photo.png" alt="" fill className="object-cover" />
      </div>
      <div className="relative flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-strong shrink-0">
            <Calendar className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-lg font-bold text-foreground leading-tight">
              {result ? `Week ${result.weekNumber} — Current` : "This Week's Performers"}
            </p>
            <p className="text-xs text-muted-2 mt-1">
              Official games only · auto-updates as stats are logged · archives every Sunday night
            </p>
          </div>
        </div>
        <ButtonLink href={historyHref} variant="secondary" className="!rounded-full !px-4 !py-1.5 text-xs shrink-0">
          View Full Rankings
        </ButtonLink>
      </div>

      <div className="relative border-t border-border pt-4">
        {!hasRankings ? (
          <p className="text-sm text-muted flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-muted-2" strokeWidth={2} aria-hidden />
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
