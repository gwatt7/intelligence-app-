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
import {
  gameMatchupLabel,
  gameHomeAwayLabel,
  gameArenaLabel,
  gameCityStateLabel,
  gameTimeLabel,
} from "@/lib/game-display";

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

  const arena = gameArenaLabel(game);
  const cityState = gameCityStateLabel(game);

  return (
    <div className="space-y-6">
      <PageHeader
        title={gameMatchupLabel(game)}
        subtitle={`${GAME_TYPE_LABEL[game.gameType]} · ${format(game.date, "EEEE, MMMM d, yyyy")}`}
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
        <CardTitle>Schedule</CardTitle>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">Date</dt>
            <dd className="mt-0.5">{format(game.date, "MMM d, yyyy")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">Home / Away</dt>
            <dd className="mt-0.5">{gameHomeAwayLabel(game.homeAway)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">Game Time</dt>
            <dd className="mt-0.5">{gameTimeLabel(game)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">Rink / Arena</dt>
            <dd className="mt-0.5">{arena || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">City, State</dt>
            <dd className="mt-0.5">{cityState || "—"}</dd>
          </div>
          {(game.tournamentName || game.specialEvent) && (
            <div>
              <dt className="text-xs text-muted uppercase tracking-wide">Event</dt>
              <dd className="mt-0.5 flex flex-wrap gap-1.5">
                {game.tournamentName && <Badge tone="neutral">{game.tournamentName}</Badge>}
                {game.specialEvent && <Badge tone="warning">{game.specialEvent}</Badge>}
              </dd>
            </div>
          )}
        </dl>
      </Card>

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
