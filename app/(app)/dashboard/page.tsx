import Link from "next/link";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { metricValue, change } from "@/lib/team-analytics";
import { getTeamStatEntries } from "@/lib/team-analytics-server";
import { buildRankings } from "@/lib/rankings";
import { getCurrentWeekRankings } from "@/lib/weekly-rankings";
import { getGameStatContributions } from "@/lib/player-analytics";
import { DEFAULT_WEEK_TIMEZONE } from "@/lib/calendar-week";
import { formatChange, formatPct, getStatValue, pct, sumStatLines, zoneEntryPct, zoneExitPct } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import styles from "@/components/dashboard/dashboard.module.css";
import { dashFontVars } from "@/components/dashboard/dashboardFonts";
import { HeadingLink, SectionHeading, display, panel, shortSeason } from "@/components/dashboard/dashboardUi";
import {
  currentStreak,
  homeArena,
  pointsLeader,
  reportCardPoints,
  seasonRecord,
  spotlightPlayer,
  teamLeaders,
  type ReportCardRow,
  type ScheduleGame,
} from "@/components/dashboard/dashboardData";
import { ScheduleStrip } from "@/components/dashboard/ScheduleStrip";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { NextGameCard } from "@/components/dashboard/NextGameCard";
import { SnapshotCard } from "@/components/dashboard/SnapshotCard";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { TopPerformerSpotlightCard } from "@/components/dashboard/TopPerformerSpotlightCard";
import { TeamLeaders } from "@/components/dashboard/TeamLeaders";
import { TeamTrendsCard, type TrendGame } from "@/components/dashboard/TeamTrendsCard";
import { LastGameCard } from "@/components/dashboard/LastGameCard";
import { NextMiniGameCard } from "@/components/dashboard/NextMiniGameCard";
import { QuickAccessCard } from "@/components/dashboard/QuickAccessCard";
import { WeeklyPerformanceSection } from "@/components/dashboard/WeeklyPerformanceSection";

const TREND_KEYS = ["shots", "scoringChances", "goals", "disruptions", "blocks", "hits"] as const;

export default async function DashboardPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState
          title="Welcome to NORTHSTAR"
          description="Start by creating your season and team."
          action={<ButtonLink href="/team">Set Up Season & Team</ButtonLink>}
        />
      </div>
    );
  }

  const now = new Date();

  const [nextGame, lastGame, nextMiniGame, team] = await Promise.all([
    prisma.game.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.game.findFirst({
      where: { seasonId: season.id, isCompleted: true, date: { lte: now } },
      orderBy: { date: "desc" },
    }),
    prisma.miniGame.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.team.findUnique({ where: { seasonId: season.id } }),
  ]);

  const teamEntries = await getTeamStatEntries(season.id);
  const last5 = teamEntries.slice(-5);
  const entryTrend = change(metricValue(last5, "zoneEntryPct", true), metricValue(teamEntries, "zoneEntryPct", true));
  const exitTrend = change(metricValue(last5, "zoneExitPct", true), metricValue(teamEntries, "zoneExitPct", true));
  const teamTrend =
    entryTrend !== null && exitTrend !== null ? (entryTrend + exitTrend) / 2 : entryTrend ?? exitTrend;

  // Real per-game series (zone entry/exit % averaged per game) for the Team
  // Trend sparkline — the same last-5-games window as teamTrend above, just
  // plotted point-by-point instead of collapsed to one delta.
  const teamTrendSeries = last5
    .map((e) => {
      const entryPct = zoneEntryPct(e.stat);
      const exitPct = zoneExitPct(e.stat);
      if (entryPct === null && exitPct === null) return null;
      if (entryPct === null) return exitPct;
      if (exitPct === null) return entryPct;
      return (entryPct + exitPct) / 2;
    })
    .filter((v): v is number => v !== null);

  const rankings = await buildRankings(season.id);
  const weeklyRankings = await getCurrentWeekRankings(season.id);
  const topPerformer = rankings.topPerformanceIndex[0];
  const mostImproved = rankings.mostImproved[0];

  // Top Performer reuses the existing Performance-Index ranking above (the
  // Dashboard's Top Performer card shows Official-Game data only; the
  // separate Mini-Game top-performer ranking in lib/mini-game-analytics.ts
  // is untouched and still computed/used elsewhere, just not surfaced here).
  const gameContributions = topPerformer ? await getGameStatContributions(topPerformer.playerId) : [];

  const lastGameResult =
    lastGame && lastGame.ourScore !== null && lastGame.opponentScore !== null
      ? lastGame.ourScore > lastGame.opponentScore
        ? "W"
        : lastGame.ourScore < lastGame.opponentScore
        ? "L"
        : "T"
      : null;

  // ---- Display data for the dashboard design (read-only) -------------------

  const [seasonGames, rosterCount, reportCards] = await Promise.all([
    prisma.game.findMany({ where: { seasonId: season.id }, orderBy: { date: "asc" } }),
    prisma.player.count({ where: { seasonId: season.id } }),
    prisma.playerSeasonStat.findMany({ include: { player: true, season: true } }),
  ]);
  const schedule: ScheduleGame[] = seasonGames;

  const upcoming = schedule.filter((g) => g.date >= now);
  const nextScheduled = nextGame ? schedule.find((g) => g.id === nextGame.id) ?? null : null;
  const isOpener = !!nextScheduled && schedule.every((g) => g.date >= nextScheduled.date);
  const followUp = upcoming[1] ?? null;
  const rematch = nextScheduled && followUp && followUp.opponent === nextScheduled.opponent ? followUp : null;
  const record = seasonRecord(schedule);

  // Game times are stored as the local wall-clock time; the countdown targets
  // that time in the team's time zone (the same zone weekly rankings use).
  const countdownTarget =
    nextScheduled && !nextScheduled.timeTBA
      ? fromZonedTime(nextScheduled.date.toISOString().slice(0, 19), DEFAULT_WEEK_TIMEZONE).toISOString()
      : null;

  const arena = homeArena(schedule);
  const subtitle = [`${shortSeason(season.name, "–")} Season`, arena].filter(Boolean).join(" · ");

  // Most recent season that has imported report cards (e.g. 2025-2026).
  const reportSeason = [...new Set(reportCards.map((r) => r.season.name))].sort().pop() ?? null;
  const reportRows: ReportCardRow[] = reportCards
    .filter((r) => r.season.name === reportSeason)
    .map((r) => ({
      playerId: r.playerId,
      firstName: r.player.firstName,
      lastName: r.player.lastName,
      jerseyNumber: r.player.jerseyNumber,
      heroImageUrl: r.player.heroImageUrl,
      heroImageFocalX: r.player.heroImageFocalX,
      heroImageFocalY: r.player.heroImageFocalY,
      gamesPlayed: r.gamesPlayed,
      goals: r.goals,
      assists: r.assists,
      shots: r.shots,
      plusMinus: r.plusMinus,
      blocks: r.blocks,
    }));
  const reportLabel = reportSeason ? shortSeason(reportSeason) : null;
  const leaders = teamLeaders(reportRows);
  const spotlight = spotlightPlayer(reportRows);
  const lastSeasonTop = pointsLeader(reportRows);

  // Official games already played (scheduled future games have no stats yet).
  const playedEntries = teamEntries.filter((e) => e.date <= now);
  const trendGames: TrendGame[] = playedEntries.map((e) => ({
    id: e.id,
    title: `${e.label} · ${format(e.date, "MMM d")}`,
    values: Object.fromEntries(TREND_KEYS.map((k) => [k, getStatValue(e.stat, k)])),
  }));
  const seasonTotals = sumStatLines(playedEntries.map((e) => e.stat));
  const shotConversion = pct(seasonTotals.goals, seasonTotals.shots);

  return (
    <div className={`${styles.root} ${dashFontVars}`}>
      <ScheduleStrip games={upcoming.slice(0, 4)} />

      <div className="mx-auto max-w-[1440px] space-y-[24px] px-4 pb-[40px] pt-[23px] sm:px-[23px]">
        <DashboardHero
          teamName={team?.name ?? "Team"}
          subtitle={subtitle}
          record={record}
          gamesLeft={schedule.filter((g) => !g.isCompleted).length}
          rosterCount={rosterCount}
          streak={currentStreak(schedule)}
        />

        <NextGameCard
          game={nextScheduled}
          isOpener={isOpener}
          ourRecord={record}
          rematch={rematch}
          countdownTarget={countdownTarget}
          renderedAt={now.toISOString()}
        />

        {/* Performance Snapshot */}
        <section className="pt-[11px]">
          <SectionHeading title="Performance Snapshot" action={<HeadingLink href="/analytics">All team stats ›</HeadingLink>} />
          <div className={`${panel} grid grid-cols-1 overflow-hidden sm:grid-cols-2 xl:grid-cols-4 [&>*+*]:border-t [&>*+*]:[--border:#eef0f2] sm:[&>*+*]:border-t-0 sm:[&>*:nth-child(n+3)]:border-t xl:[&>*:nth-child(n+3)]:border-t-0 sm:[&>*:nth-child(even)]:border-l xl:[&>*+*]:border-l`}>
            <SnapshotCard highlight label={<>Team Trend {teamTrend !== null && <span aria-hidden>{teamTrend < 0 ? "▼" : "▲"}</span>}</>}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[36px] font-bold leading-none tracking-[-0.01em] text-[#0d1116]">{teamTrend !== null ? formatChange(teamTrend) : "–"}</p>
                  <p className="mt-[9px] text-[12.5px] leading-[16px] text-[#2f2700]">vs. last 5 games</p>
                </div>
                {teamTrendSeries.length > 1 && (
                  <div className="mb-[6px]">
                    <Sparkline points={teamTrendSeries} />
                  </div>
                )}
              </div>
            </SnapshotCard>

            <TopPerformerSpotlightCard
              current={
                topPerformer
                  ? {
                      playerId: topPerformer.playerId,
                      name: topPerformer.name,
                      jerseyNumber: topPerformer.jerseyNumber,
                      seasonLabel: shortSeason(season.name),
                      contributions: gameContributions,
                    }
                  : null
              }
              fallback={
                lastSeasonTop && reportLabel
                  ? {
                      playerId: lastSeasonTop.playerId,
                      name: `${lastSeasonTop.firstName} ${lastSeasonTop.lastName}`,
                      jerseyNumber: lastSeasonTop.jerseyNumber,
                      seasonLabel: reportLabel,
                      line: `${reportCardPoints(lastSeasonTop)} PTS · ${lastSeasonTop.goals ?? 0} G · ${lastSeasonTop.assists ?? 0} A`,
                    }
                  : null
              }
            />

            <SnapshotCard label="Most Improved">
              <div className="flex items-center gap-[14px]">
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#fff3c6] text-[#8a6d00]">
                  <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />
                  </svg>
                </span>
                {mostImproved ? (
                  <Link href={`/players/${mostImproved.playerId}`} className="min-w-0 hover:opacity-85">
                    <span className={`${display} block text-[23px] font-bold leading-none text-[#0d1116]`}>{formatChange(mostImproved.value)}</span>
                    <span className="mt-[5px] block truncate text-[13px] text-[#5b626b]">
                      #{mostImproved.jerseyNumber} {mostImproved.name}
                    </span>
                  </Link>
                ) : (
                  <div>
                    <p className={`${display} text-[23px] font-bold leading-none text-[#0d1116]`}>–</p>
                    <p className="mt-[5px] text-[13px] text-[#5b626b]">Needs 2+ games this season</p>
                  </div>
                )}
              </div>
            </SnapshotCard>

            <SnapshotCard label="Team Efficiency">
              <p className="text-[36px] font-bold leading-none tracking-[-0.01em] text-[#0d1116]">
                {shotConversion === null ? "–%" : formatPct(shotConversion)}
              </p>
              <div className="mt-[6px] h-[6px] w-full overflow-hidden rounded-full bg-[#eef0f2]">
                <div className="h-full rounded-full bg-[#f5b800]" style={{ width: `${Math.min(100, shotConversion ?? 0)}%` }} />
              </div>
              <p className="mt-[8px] text-[12.5px] leading-[16px] text-[#5b626b]">Shot conversion, season</p>
            </SnapshotCard>
          </div>
        </section>

        {/* Last season's team leaders (imported report cards) */}
        {reportLabel && (
          <section className="pt-[11px]">
            <SectionHeading
              title={`${reportLabel} Team Leaders`}
              action={
                lastSeasonTop ? <HeadingLink href={`/players/${lastSeasonTop.playerId}`}>Last season&apos;s report cards →</HeadingLink> : undefined
              }
            />
            <TeamLeaders spotlight={spotlight} leaders={leaders} />
          </section>
        )}

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[minmax(0,708fr)_minmax(0,383fr)]">
          <TeamTrendsCard games={trendGames} />
          <div className="space-y-[24px]">
            <LastGameCard game={lastGame} result={lastGameResult} nextOpponent={isOpener ? nextScheduled?.opponent ?? null : null} />
            <NextMiniGameCard miniGame={nextMiniGame} />
            <QuickAccessCard />
          </div>
        </div>

        {/* Weekly Performance Rankings — Top 3 / Bottom 3 of the current week */}
        <WeeklyPerformanceSection result={weeklyRankings} historyHref="/weekly-rankings" />
      </div>
    </div>
  );
}
