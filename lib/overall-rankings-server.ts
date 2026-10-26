// Data loading for Overall Player Rankings (see lib/overall-rankings.ts for
// the rating model). Reads the existing tables only — nothing is stored, so
// rankings are recalculated from the current stats on every page load.
//
// Data sources by period (never mixed):
//   • Season / Last 5 Games → official game stats (GamePlayerStat)
//   • Practice              → Mini Game stats (MiniGamePlayerStat)
//   • Season, for a season with no game stats but imported report cards
//     (PlayerSeasonStat, e.g. 2025-26) → those report cards

import { prisma } from "@/lib/db";
import { EMPTY_STAT_LINE, type RawStatLine } from "@/lib/stats";
import {
  applyMovement,
  computeRankings,
  type PlayerSample,
  type RankingGroup,
  type RankingPeriod,
  type RankingResult,
  type StatKey,
  type StatTotals,
} from "@/lib/overall-rankings";

const STAT_KEYS = Object.keys(EMPTY_STAT_LINE) as StatKey[];

export type RankingSource = "games" | "practice" | "report-cards" | "none";

export interface OverallRankingsData {
  result: RankingResult;
  source: RankingSource;
  /** Most recent game/session date included. */
  through: Date | null;
  /** True when rank movement compares against the rankings before the most recent game/session. */
  hasMovement: boolean;
}

interface Entry {
  date: Date;
  stat: RawStatLine;
}

type Roster = { id: string; firstName: string; lastName: string; jerseyNumber: number; position: "FORWARD" | "DEFENSE" | "GOALIE" }[];

function sumTotals(entries: Entry[]): StatTotals {
  const t = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Record<StatKey, number>;
  for (const e of entries) for (const k of STAT_KEYS) t[k] += e.stat[k];
  return t;
}

function samplesFromEntries(roster: Roster, byPlayer: Map<string, Entry[]>, period: RankingPeriod, before?: Date): PlayerSample[] {
  return roster.map((p) => {
    let entries = (byPlayer.get(p.id) ?? []).filter((e) => !before || e.date < before);
    if (period === "last5") entries = entries.slice(-5);
    return {
      playerId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      games: entries.length,
      totals: entries.length > 0 ? sumTotals(entries) : null,
    };
  });
}

function group<T extends { playerId: string; date: Date }>(rows: T[], toStat: (r: T) => RawStatLine): Map<string, Entry[]> {
  const m = new Map<string, Entry[]>();
  for (const r of rows) m.set(r.playerId, [...(m.get(r.playerId) ?? []), { date: r.date, stat: toStat(r) }]);
  for (const list of m.values()) list.sort((a, b) => a.date.getTime() - b.date.getTime());
  return m;
}

export async function getOverallRankings(seasonId: string, rankingGroup: RankingGroup, period: RankingPeriod): Promise<OverallRankingsData> {
  const roster: Roster = await prisma.player.findMany({
    where: { seasonId },
    select: { id: true, firstName: true, lastName: true, jerseyNumber: true, position: true },
    orderBy: { jerseyNumber: "asc" },
  });

  let byPlayer: Map<string, Entry[]>;
  if (period === "practice") {
    const rows = await prisma.miniGamePlayerStat.findMany({ where: { miniGame: { seasonId } }, include: { miniGame: { select: { date: true } } } });
    byPlayer = group(rows.map((r) => ({ ...r, date: r.miniGame.date })), (r) => r);
  } else {
    const rows = await prisma.gamePlayerStat.findMany({ where: { game: { seasonId } }, include: { game: { select: { date: true } } } });
    byPlayer = group(rows.map((r) => ({ ...r, date: r.game.date })), (r) => r);
  }

  const hasEntries = [...byPlayer.values()].some((l) => l.length > 0);

  // A past season tracked only through imported report cards.
  if (!hasEntries && period === "season") {
    const cards = await prisma.playerSeasonStat.findMany({ where: { seasonId } });
    if (cards.length > 0) {
      const byId = new Map(cards.map((c) => [c.playerId, c]));
      const samples: PlayerSample[] = roster.map((p) => {
        const c = byId.get(p.id);
        const games = c?.gamesPlayed ?? 0;
        // A blank cell for a player who played is read as 0 (its meaning on a
        // scoring sheet). Columns blank for everyone stay "not recorded" —
        // computeRankings treats all-zero columns as untracked.
        const v = (x: number | null) => x ?? (c?.gamesPlayed ? 0 : null);
        const totals: StatTotals | null = c
          ? {
              ...(Object.fromEntries(STAT_KEYS.map((k) => [k, null])) as StatTotals),
              goals: v(c.goals),
              assists: v(c.assists),
              shots: v(c.shots),
              scoringChances: v(c.scoringChances),
              takeaways: v(c.takeaways),
              giveaways: v(c.giveaways),
              hits: v(c.hits),
              blocks: v(c.blocks),
              saves: v(c.saves),
              shotsAgainst: v(c.shotsAgainst),
              goalsAgainst: v(c.goalsAgainst),
            }
          : null;
        return { playerId: p.id, name: `${p.firstName} ${p.lastName}`, jerseyNumber: p.jerseyNumber, position: p.position, games, totals };
      });
      const result = computeRankings(rankingGroup, period, samples);
      result.notes.unshift(
        rankingGroup === "goalies"
          ? "Rated from the imported season report cards. They don't include goalie kills, so Kills is left out (not counted as zero) and the other categories are re-weighted."
          : "Rated from the imported season report cards. They don't include zone entry/exit success, opportunity quality, disruptions or faceoff counts, so those categories are left out (not counted as zero) and the rest are re-weighted."
      );
      return { result, source: "report-cards", through: null, hasMovement: false };
    }
  }

  const samples = samplesFromEntries(roster, byPlayer, period);
  let result = computeRankings(rankingGroup, period, samples);

  // Movement: compare with the rankings as they stood before the most recent game/session.
  const allDates = [...byPlayer.values()].flat().map((e) => e.date.getTime());
  const latest = allDates.length > 0 ? new Date(Math.max(...allDates)) : null;
  let hasMovement = false;
  if (latest) {
    const before = computeRankings(rankingGroup, period, samplesFromEntries(roster, byPlayer, period, latest));
    if (before.players.some((p) => p.rank !== null)) {
      result = applyMovement(result, before);
      hasMovement = true;
    }
  }

  return { result, source: hasEntries ? (period === "practice" ? "practice" : "games") : "none", through: latest, hasMovement };
}
