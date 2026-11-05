import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeasonTeamOnboardingForm } from "@/components/forms/SeasonTeamOnboardingForm";
import { TeamInfoForm } from "@/components/forms/TeamInfoForm";
import { SeasonSwitcher } from "@/components/forms/SeasonSwitcher";
import { RosterSection } from "@/components/roster/RosterSection";

export default async function TeamPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Team" subtitle="Set up your season and team to get started." />
        <Card>
          <CardTitle>Create Your First Season</CardTitle>
          <SeasonTeamOnboardingForm />
        </Card>
      </div>
    );
  }

  const [team, players, seasons] = await Promise.all([
    prisma.team.findUnique({ where: { seasonId: season.id } }),
    prisma.player.findMany({ where: { seasonId: season.id }, orderBy: { jerseyNumber: "asc" } }),
    prisma.season.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle={`Season ${season.name}`}
        actions={<SeasonSwitcher seasons={seasons} currentSeasonId={season.id} />}
      />

      <Card>
        <CardTitle>Team Information</CardTitle>
        {team ? (
          <TeamInfoForm seasonId={season.id} team={team} />
        ) : (
          <EmptyState title="No team info for this season yet" />
        )}
      </Card>

      <Card>
        <RosterSection seasonId={season.id} players={players} />
      </Card>
    </div>
  );
}
