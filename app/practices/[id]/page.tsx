import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { PracticeNotesForm } from "@/components/forms/PracticeNotesForm";
import { StatEntryList } from "@/components/stats/StatEntryList";
import { CsvImportPanel } from "@/components/shared/CsvImportPanel";
import { importPracticeStatsFromCsv, savePracticePlayerStat } from "@/lib/actions/practices";
import type { RawStatLine } from "@/lib/stats";

export default async function PracticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const practice = await prisma.practice.findUnique({
    where: { id },
    include: { playerStats: true },
  });
  if (!practice) notFound();

  const players = await prisma.player.findMany({
    where: { seasonId: practice.seasonId },
    orderBy: { jerseyNumber: "asc" },
  });

  const statsByPlayer = new Map<string, RawStatLine>(practice.playerStats.map((s) => [s.playerId, s]));

  const boundImport = importPracticeStatsFromCsv.bind(null, practice.id, practice.seasonId);
  const boundSave = savePracticePlayerStat.bind(null, practice.id);

  return (
    <div className="space-y-6">
      <PageHeader title={`Practice ${practice.number}`} subtitle={`Week ${practice.week} · ${format(practice.date, "MMMM d, yyyy")}`} />

      <Card>
        <CardTitle>Details</CardTitle>
        <PracticeNotesForm
          practiceId={practice.id}
          location={practice.location}
          focus={practice.focus}
          notes={practice.notes}
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
