import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { getSeasonStatEntriesByPlayer, performanceIndexForEntries, recentTrendForEntries } from "@/lib/player-analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { PlayerCard } from "@/components/players/PlayerCard";

export default async function PlayersPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Players" />
        <EmptyState
          title="No season yet"
          description="Set up your season and team first."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      </div>
    );
  }

  const [players, entriesByPlayer] = await Promise.all([
    prisma.player.findMany({ where: { seasonId: season.id }, orderBy: { jerseyNumber: "asc" } }),
    getSeasonStatEntriesByPlayer(season.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Players"
        subtitle={`Season ${season.name}`}
        actions={<ButtonLink href="/players/compare" variant="secondary">Compare Players</ButtonLink>}
      />

      {players.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Add players from the Team tab."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {players.map((p) => {
            const entries = entriesByPlayer.get(p.id) ?? [];
            const index = performanceIndexForEntries(entries, p.position);
            const trend = recentTrendForEntries(entries, p.position);
            return <PlayerCard key={p.id} player={p} index={index ? index.score : null} trend={trend} />;
          })}
        </div>
      )}
    </div>
  );
}
