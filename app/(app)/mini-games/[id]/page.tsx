import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { MiniGameNotesForm } from "@/components/forms/MiniGameNotesForm";
import { StatEntryList } from "@/components/stats/StatEntryList";
import { CsvImportPanel } from "@/components/shared/CsvImportPanel";
import { importMiniGameStatsFromCsv, saveMiniGamePlayerStat } from "@/lib/actions/mini-games";
import type { RawStatLine } from "@/lib/stats";

export default async function MiniGameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const miniGame = await prisma.miniGame.findUnique({
    where: { id },
    include: { playerStats: true },
  });
  if (!miniGame) notFound();

  const players = await prisma.player.findMany({
    where: { seasonId: miniGame.seasonId },
    orderBy: { jerseyNumber: "asc" },
  });

  const statsByPlayer = new Map<string, RawStatLine>(miniGame.playerStats.map((s) => [s.playerId, s]));

  const boundImport = importMiniGameStatsFromCsv.bind(null, miniGame.id, miniGame.seasonId);
  const boundSave = saveMiniGamePlayerStat.bind(null, miniGame.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Mini Game — ${format(miniGame.date, "MMMM d, yyyy")}`}
        subtitle="Tracked completely separately from official game stats"
      />

      <Card>
        <CardTitle>Details</CardTitle>
        <MiniGameNotesForm miniGameId={miniGame.id} date={miniGame.date} notes={miniGame.notes} />
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
