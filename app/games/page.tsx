import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";

const GAME_TYPE_LABEL = { PRESEASON: "Preseason", REGULAR_SEASON: "Regular Season", PLAYOFFS: "Playoffs" } as const;
const GAME_TYPE_ORDER = ["PRESEASON", "REGULAR_SEASON", "PLAYOFFS"] as const;

export default async function GamesPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Games" />
        <EmptyState
          title="No season yet"
          description="Set up your season and team first."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      </div>
    );
  }

  const games = await prisma.game.findMany({ where: { seasonId: season.id }, orderBy: { date: "asc" } });
  const byType = new Map<string, typeof games>();
  for (const g of games) {
    byType.set(g.gameType, [...(byType.get(g.gameType) ?? []), g]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Games"
        subtitle={`Season ${season.name}`}
        actions={<ButtonLink href="/games/new">+ Add Game</ButtonLink>}
      />

      {games.length === 0 ? (
        <EmptyState title="No games yet" description="Create your first game to start logging results." />
      ) : (
        <div className="space-y-6">
          {GAME_TYPE_ORDER.filter((t) => byType.has(t)).map((type) => (
            <div key={type}>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">{GAME_TYPE_LABEL[type]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {byType.get(type)!.map((g) => {
                  const result =
                    g.isCompleted && g.ourScore !== null && g.opponentScore !== null
                      ? g.ourScore > g.opponentScore
                        ? "W"
                        : g.ourScore < g.opponentScore
                        ? "L"
                        : "T"
                      : null;
                  return (
                    <Link key={g.id} href={`/games/${g.id}`}>
                      <Card className="hover:border-accent/50 transition-colors h-full">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">
                            {g.homeAway === "HOME" ? "vs" : "@"} {g.opponent}
                          </p>
                          {result && (
                            <Badge tone={result === "W" ? "positive" : result === "L" ? "negative" : "neutral"}>
                              {result} {g.ourScore}-{g.opponentScore}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">{format(g.date, "MMM d, yyyy")}</p>
                        {!g.isCompleted && (
                          <Badge tone="accent" className="mt-2">
                            Upcoming
                          </Badge>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
