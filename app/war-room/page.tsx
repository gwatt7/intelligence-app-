import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";

export default async function WarRoomPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="War Room" />
        <EmptyState
          title="No season yet"
          description="Set up your season and team first."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      </div>
    );
  }

  const games = await prisma.game.findMany({
    where: { seasonId: season.id },
    orderBy: { date: "asc" },
    include: { warRoom: true },
  });

  if (games.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="War Room" subtitle={`Season ${season.name}`} />
        <EmptyState
          title="No games yet"
          description="Add a game first, then build its Mission Brief here."
          action={<ButtonLink href="/games/new">Add Game</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="War Room" subtitle={`Season ${season.name}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {games.map((g) => {
          const status = g.isCompleted
            ? g.warRoom?.afterActionSavedAt
              ? { label: "AAR Complete", tone: "positive" as const }
              : { label: "Needs After Action Report", tone: "warning" as const }
            : g.warRoom?.missionBriefSavedAt
            ? { label: "Mission Brief Ready", tone: "accent" as const }
            : { label: "No Mission Brief", tone: "neutral" as const };

          return (
            <Link key={g.id} href={`/war-room/${g.id}`}>
              <Card className="hover:border-accent/50 transition-colors h-full">
                <p className="font-medium text-foreground">
                  {g.homeAway === "HOME" ? "vs" : "@"} {g.opponent}
                </p>
                <p className="text-xs text-muted mt-1">{format(g.date, "MMM d, yyyy")}</p>
                <Badge tone={status.tone} className="mt-2">
                  {status.label}
                </Badge>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
