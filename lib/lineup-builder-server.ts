// Loads everything the Lineup Builder needs for a season and runs it.
// Read-only; called on every visit to /lineup, so the lineup always
// reflects the latest stats, positions and availability.

import { prisma } from "@/lib/db";
import { getSeasonStatEntriesByPlayer, getSeasonPlusMinusByPlayer } from "@/lib/player-analytics";
import { getSeasonAllSituationScoringByPlayer } from "@/lib/game-situations-server";
import { getSeasonAvailabilityExclusions, isPlayedGame } from "@/lib/player-availability";
import { buildLineup, type LastSeasonLine, type LineupPlayerInput, type LineupResult } from "@/lib/lineup-builder";

export interface LineupPageData {
  result: LineupResult;
  nextGame: { opponent: string; date: Date; homeAway: "HOME" | "AWAY" | "NEUTRAL" } | null;
  gamesPlayed: number;
  lastSeasonName: string | null;
}

const nameKey = (first: string, last: string) => `${first.trim().toLowerCase()} ${last.trim().toLowerCase()}`;

export async function getLineup(seasonId: string, seasonName: string, maxOptions = 10): Promise<LineupPageData> {
  const now = new Date();
  const [players, games, statRows, entries, scoring, plusMinus, exclusions, lastSeasonRows] = await Promise.all([
    prisma.player.findMany({ where: { seasonId } }),
    prisma.game.findMany({ where: { seasonId }, select: { id: true, date: true, opponent: true, homeAway: true, isCompleted: true } }),
    prisma.gamePlayerStat.findMany({ where: { game: { seasonId } }, select: { gameId: true } }),
    getSeasonStatEntriesByPlayer(seasonId),
    getSeasonAllSituationScoringByPlayer(seasonId),
    getSeasonPlusMinusByPlayer(seasonId),
    getSeasonAvailabilityExclusions(seasonId),
    // Imported report cards from earlier seasons (never the current one).
    prisma.playerSeasonStat.findMany({
      where: { season: { name: { not: seasonName } } },
      include: { player: true, season: true },
    }),
  ]);

  const gameIdsWithStats = new Set(statRows.map((r) => r.gameId));
  const playedIds = new Set(games.filter((g) => isPlayedGame(g, gameIdsWithStats)).map((g) => g.id));
  const nextGame =
    games.filter((g) => g.date >= now && !playedIds.has(g.id)).sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;

  // Most recent earlier season with report cards, matched to this season's players by name.
  const lastSeasonName = [...new Set(lastSeasonRows.map((r) => r.season.name))].sort().pop() ?? null;
  const lastByName = new Map<string, LastSeasonLine>();
  for (const r of lastSeasonRows) {
    if (r.season.name !== lastSeasonName) continue;
    lastByName.set(nameKey(r.player.firstName, r.player.lastName), {
      gamesPlayed: r.gamesPlayed,
      goals: r.goals,
      assists: r.assists,
      shots: r.shots,
      takeaways: r.takeaways,
      giveaways: r.giveaways,
      hits: r.hits,
      blocks: r.blocks,
      plusMinus: r.plusMinus,
      faceoffWinPct: r.faceoffWinPct,
    });
  }

  const input: LineupPlayerInput[] = players.map((p) => {
    let gamesScratched = 0;
    let gamesInjured = 0;
    for (const gameId of playedIds) {
      const s = exclusions.get(`${p.id}:${gameId}`);
      if (s === "SCRATCHED") gamesScratched++;
      else if (s === "INJURED") gamesInjured++;
    }
    const next = nextGame ? exclusions.get(`${p.id}:${nextGame.id}`) : undefined;
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      primaryPosition: p.primaryPosition,
      secondaryPosition: p.secondaryPosition,
      shoots: p.shoots,
      status: p.status,
      games: (entries.get(p.id) ?? []).map((e) => ({ stat: e.stat, untrackedFields: e.untrackedFields })),
      seasonGoals: scoring.get(p.id)?.goals ?? 0,
      seasonAssists: scoring.get(p.id)?.assists ?? 0,
      seasonPlusMinus: plusMinus.get(p.id) ?? 0,
      gamesScratched,
      gamesInjured,
      nextGameStatus: next === "SCRATCHED" || next === "INJURED" ? next : null,
      lastSeason: lastByName.get(nameKey(p.firstName, p.lastName)) ?? null,
    };
  });

  return {
    result: buildLineup({ players: input, teamGamesPlayed: playedIds.size }, maxOptions),
    nextGame: nextGame ? { opponent: nextGame.opponent, date: nextGame.date, homeAway: nextGame.homeAway } : null,
    gamesPlayed: playedIds.size,
    lastSeasonName,
  };
}
