import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { getMiniGameTeamOverview } from "@/lib/mini-game-analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MiniGameTeamOverview } from "@/components/mini-games/MiniGameTeamOverview";
import Link from "next/link";
import { format } from "date-fns";

export default async function MiniGamesPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Mini Games" />
        <EmptyState
          title="No season yet"
          description="Set up your season and team first."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      </div>
    );
  }

  const [miniGames, overview] = await Promise.all([
    prisma.miniGame.findMany({
      where: { seasonId: season.id },
      orderBy: { date: "desc" },
      include: { _count: { select: { playerStats: true } } },
    }),
    getMiniGameTeamOverview(season.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mini Games"
        subtitle={`Season ${season.name} · Tracked completely separately from official game stats`}
        actions={<ButtonLink href="/mini-games/new">+ Add Mini Game</ButtonLink>}
      />

      <div>
        <h2 className="text-sm font-medium text-muted mb-2.5">Mini Game Team Overview</h2>
        <MiniGameTeamOverview topProgressing={overview.topProgressing} trendingDown={overview.trendingDown} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted mb-2.5">Mini Game History</h2>
        {miniGames.length === 0 ? (
          <EmptyState title="No Mini Games yet" description="Create your first Mini Game to start tracking stats." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {miniGames.map((mg) => (
              <Link key={mg.id} href={`/mini-games/${mg.id}`}>
                <Card className="hover:border-accent/50 transition-colors h-full">
                  <p className="font-medium text-foreground">{format(mg.date, "MMM d, yyyy")}</p>
                  {mg.notes && <p className="text-xs text-muted mt-1 line-clamp-2">{mg.notes}</p>}
                  <p className="text-xs text-muted-2 mt-2">{mg._count.playerStats} player(s) logged</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
