import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { getSeasonStatEntriesByPlayer, getSeasonPlusMinusByPlayer } from "@/lib/player-analytics";
import { getSeasonAllSituationScoringByPlayer } from "@/lib/game-situations-server";
import { sumStatLines, formatPlusMinus, EMPTY_STAT_LINE } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const POSITION_LABEL = { FORWARD: "F", DEFENSE: "D", GOALIE: "G" } as const;

export default async function StatisticsPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Statistics" />
        <EmptyState
          title="No season yet"
          description="Set up your season and team first."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      </div>
    );
  }

  const [roster, entriesByPlayer, plusMinusByPlayer, scoringByPlayer] = await Promise.all([
    prisma.player.findMany({ where: { seasonId: season.id }, orderBy: { jerseyNumber: "asc" } }),
    getSeasonStatEntriesByPlayer(season.id),
    getSeasonPlusMinusByPlayer(season.id),
    getSeasonAllSituationScoringByPlayer(season.id),
  ]);

  // Every player on the active-season roster, ranked by Points highest to
  // lowest — ties broken by goals, then jersey number. Goals/Assists/Points
  // are the real season totals (5-on-5 + Power Play + Penalty Kill
  // combined, via getSeasonAllSituationScoringByPlayer) — a power-play
  // goal or assist isn't dropped here. Shots/Shot Attempts stay
  // 5-on-5-only (unchanged, out of scope). Availability-aware for free:
  // entriesByPlayer already excludes Scratched/Injured games and counts a
  // Dressed zero-stat game as played (see getSeasonStatEntriesByPlayer in
  // lib/player-analytics.ts).
  const rows = roster.map((p) => {
    const entries = entriesByPlayer.get(p.id) ?? [];
    const totals = entries.length > 0 ? sumStatLines(entries.map((e) => e.stat)) : EMPTY_STAT_LINE;
    const scoring = scoringByPlayer.get(p.id) ?? { goals: 0, assists: 0 };
    return {
      player: p,
      gamesPlayed: entries.length,
      goals: scoring.goals,
      assists: scoring.assists,
      points: scoring.goals + scoring.assists,
      plusMinus: p.position === "GOALIE" ? null : (plusMinusByPlayer.get(p.id) ?? 0),
      shots: totals.shots,
      shotAttempts: totals.shotAttempts,
    };
  });

  const sorted = [...rows].sort(
    (a, b) => b.points - a.points || b.goals - a.goals || a.player.jerseyNumber - b.player.jerseyNumber
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Statistics" subtitle={`Season ${season.name} · every player, ranked by points`} />

      {sorted.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Add players from the Team tab."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-3 pl-4 pr-2">#</th>
                  <th className="py-3 px-2">Player</th>
                  <th className="py-3 px-2 text-right">GP</th>
                  <th className="py-3 px-2 text-right">G</th>
                  <th className="py-3 px-2 text-right">A</th>
                  <th className="py-3 px-2 text-right font-bold text-foreground">PTS</th>
                  <th className="py-3 px-2 text-right">+/-</th>
                  <th className="py-3 px-2 text-right">Shots</th>
                  <th className="py-3 pl-2 pr-4 text-right">Shot Att.</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={r.player.id} className="border-b border-border last:border-b-0 hover:bg-surface-raised">
                    <td className="py-2.5 pl-4 pr-2 text-muted">{i + 1}</td>
                    <td className="py-2.5 px-2">
                      <Link href={`/players/${r.player.id}`} className="flex items-center gap-2 font-medium text-foreground hover:underline">
                        <span className="text-muted-2">#{r.player.jerseyNumber}</span>
                        {r.player.firstName} {r.player.lastName}
                        <Badge tone="neutral">{POSITION_LABEL[r.player.position]}</Badge>
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-right">{r.gamesPlayed}</td>
                    <td className="py-2.5 px-2 text-right">{r.goals}</td>
                    <td className="py-2.5 px-2 text-right">{r.assists}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-foreground">{r.points}</td>
                    <td className="py-2.5 px-2 text-right">{r.plusMinus !== null ? formatPlusMinus(r.plusMinus) : "—"}</td>
                    <td className="py-2.5 px-2 text-right">{r.shots}</td>
                    <td className="py-2.5 pl-2 pr-4 text-right">{r.shotAttempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
