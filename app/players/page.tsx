import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { getSeasonStatEntriesByPlayer, performanceIndexForEntries, recentTrendForEntries } from "@/lib/player-analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge, TrendBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import Link from "next/link";

const POSITION_LABEL = { FORWARD: "Forward", DEFENSE: "Defense", GOALIE: "Goalie" } as const;

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
        <Table>
          <THead>
            <tr>
              <Th>#</Th>
              <Th>Name</Th>
              <Th>Position</Th>
              <Th>Status</Th>
              <Th>Performance Index</Th>
              <Th>Recent Trend</Th>
            </tr>
          </THead>
          <TBody>
            {players.map((p) => {
              const entries = entriesByPlayer.get(p.id) ?? [];
              const index = performanceIndexForEntries(entries, p.position);
              const trend = recentTrendForEntries(entries, p.position);
              return (
                <Tr key={p.id}>
                  <Td className="font-mono text-muted">#{p.jerseyNumber}</Td>
                  <Td>
                    <Link href={`/players/${p.id}`} className="font-medium text-foreground hover:text-accent-strong">
                      {p.firstName} {p.lastName}
                    </Link>
                  </Td>
                  <Td className="text-muted">{POSITION_LABEL[p.position]}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td className="font-medium">{index ? index.score.toFixed(1) : "—"}</Td>
                  <Td>
                    <TrendBadge value={trend} />
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
