import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { cn } from "@/lib/cn";
import { getOverallRankings } from "@/lib/overall-rankings-server";
import { PERIOD_LABEL, type RankingGroup, type RankingPeriod } from "@/lib/overall-rankings";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Leaderboard } from "@/components/rankings/Leaderboard";
import { MethodologyPanel } from "@/components/rankings/MethodologyPanel";
import { AutoRefresh } from "@/components/rankings/AutoRefresh";
import styles from "@/components/rankings/rankings.module.css";

const GROUPS: { key: RankingGroup; label: string }[] = [
  { key: "skaters", label: "Skaters" },
  { key: "goalies", label: "Goalies" },
];
const PERIODS: RankingPeriod[] = ["season", "last5", "practice"];

function Segmented({ items }: { items: { href: string; label: string; active: boolean }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          scroll={false}
          aria-current={i.active ? "page" : undefined}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
            i.active ? "bg-accent text-accent-contrast" : "text-muted hover:bg-surface-raised hover:text-foreground"
          )}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export default async function OverallRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; period?: string; season?: string }>;
}) {
  const params = await searchParams;
  const current = await getCurrentSeason();
  if (!current) {
    return (
      <div>
        <PageHeader title="Overall Player Rankings" />
        <EmptyState title="No season set up yet" description="Set up your season and team to get started." />
      </div>
    );
  }

  const seasons = await prisma.season.findMany({ orderBy: { name: "desc" } });
  const season = seasons.find((s) => s.id === params.season) ?? current;
  const group: RankingGroup = params.group === "goalies" ? "goalies" : "skaters";
  const period: RankingPeriod = PERIODS.includes(params.period as RankingPeriod) ? (params.period as RankingPeriod) : "season";

  const href = (over: Partial<{ group: string; period: string; season: string }>) => {
    const q = new URLSearchParams({ group, period, ...(season.id !== current.id ? { season: season.id } : {}), ...over });
    if (q.get("season") === current.id) q.delete("season");
    return `/rankings?${q.toString()}`;
  };

  const data = await getOverallRankings(season.id, group, period);
  const { result } = data;
  const anyData = result.players.some((p) => p.games > 0);

  let emptyMessage: string | null = null;
  if (!anyData) {
    emptyMessage =
      period === "practice"
        ? `No practice (Mini Game) stats have been recorded for the ${season.name} season yet. Ratings appear here as soon as practice stats are saved.`
        : period === "last5"
          ? `No game-by-game stats are recorded for the ${season.name} season${season.id === current.id ? " yet" : ""}. Last 5 Games uses official game stats only.`
          : `No official game stats have been recorded for the ${season.name} season yet. Ratings appear here as soon as game stats are saved.`;
  }

  const sourceText =
    data.source === "report-cards"
      ? `${season.name} season report cards`
      : data.source === "practice"
        ? "Mini Game (practice) stats"
        : data.source === "games"
          ? period === "last5"
            ? "each player's last 5 official games"
            : "official game stats"
          : null;

  return (
    <div className={`${styles.root} space-y-5`}>
      <AutoRefresh />
      <PageHeader
        title="Overall Player Rankings"
        subtitle="Ratings out of 100, recalculated automatically from the latest stats whenever game or practice stats are added, edited or deleted."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented items={GROUPS.map((g) => ({ href: href({ group: g.key }), label: g.label, active: g.key === group }))} />
        <Segmented items={PERIODS.map((p) => ({ href: href({ period: p }), label: PERIOD_LABEL[p], active: p === period }))} />
        {seasons.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>Season</span>
            <Segmented items={seasons.map((s) => ({ href: href({ season: s.id }), label: s.name, active: s.id === season.id }))} />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-2">
        {group === "skaters" ? "Forwards and defensemen" : "Goalies only — rated separately from skaters"}
        {sourceText && ` · Based on ${sourceText}`}
        {data.through && ` · Through ${format(data.through, "MMM d, yyyy")}`}
        {data.hasMovement ? " · ▲▼ = places moved since before the most recent game/session" : ""}
        {" · Click a player for the full breakdown, or their name for the player profile"}
      </p>

      {result.notes.map((n) => (
        <p key={n} className="rounded-lg border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning">
          {n}
        </p>
      ))}
      {anyData && result.untracked.length > 0 && data.source !== "report-cards" && (
        <p className="text-xs text-muted-2">Not recorded for anyone in this period (left out, not counted as zero): {result.untracked.join(", ")}.</p>
      )}

      {emptyMessage && <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">{emptyMessage}</p>}

      <Leaderboard players={result.players} period={period} group={group} />

      <MethodologyPanel group={group} />
    </div>
  );
}
