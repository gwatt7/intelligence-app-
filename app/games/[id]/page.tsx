import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GameResultNotesForm } from "@/components/forms/GameResultNotesForm";
import { StatEntryList } from "@/components/stats/StatEntryList";
import { CsvImportPanel } from "@/components/shared/CsvImportPanel";
import { importGameStatsFromCsv, saveGamePlayerStat } from "@/lib/actions/games";
import { ButtonLink } from "@/components/ui/Button";
import type { RawStatLine } from "@/lib/stats";

const GAME_TYPE_LABEL = { PRESEASON: "Preseason", REGULAR_SEASON: "Regular Season", PLAYOFFS: "Playoffs" } as const;

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const game = await prisma.game.findUnique({ where: { id }, include: { playerStats: true } });
  if (!game) notFound();

  const players = await prisma.player.findMany({
    where: { seasonId: game.seasonId },
    orderBy: { jerseyNumber: "asc" },
  });

  const statsByPlayer = new Map<string, RawStatLine>(game.playerStats.map((s) => [s.playerId, s]));

  const boundImport = importGameStatsFromCsv.bind(null, game.id, game.seasonId);
  const boundSave = saveGamePlayerStat.bind(null, game.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${game.homeAway === "HOME" ? "vs" : "@"} ${game.opponent}`}
        subtitle={`${GAME_TYPE_LABEL[game.gameType]} · ${format(game.date, "MMMM d, yyyy")}`}
        actions={
          <>
            {game.isCompleted && <Badge tone="accent">Completed</Badge>}
            <ButtonLink href={`/war-room/${game.id}`} variant="secondary">
              War Room
            </ButtonLink>
          </>
        }
      />

      <Card>
        <CardTitle>Result & Notes</CardTitle>
        <GameResultNotesForm
          gameId={game.id}
          location={game.location}
          ourScore={game.ourScore}
          opponentScore={game.opponentScore}
          whatWentWell={game.whatWentWell}
          whatWentWrong={game.whatWentWrong}
          coachNotes={game.coachNotes}
        />
      </Card>

      <Card>
        <CardTitle>Import from CSV / Excel Export</CardTitle>
        <CsvImportPanel onImport={boundImport} />
      </Card>

      <div>
        <h2 className="text-sm font-medium text-muted mb-3">Player Statistics</h2>
        {players.length === 0 ? (
          <p className="text-sm text-muted">No players on the roster yet.</p>
        ) : (
          <StatEntryList saveAction={boundSave} players={players} statsByPlayer={statsByPlayer} />
        )}
      </div>
    </div>
  );
}
