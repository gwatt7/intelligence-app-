import { getCurrentSeason } from "@/lib/season";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NewGameForm } from "@/components/forms/NewGameForm";

export default async function NewGamePage() {
  const season = await getCurrentSeason();
  if (!season) redirect("/team");

  return (
    <div className="space-y-6">
      <PageHeader title="Add Game" subtitle={`Season ${season.name}`} />
      <Card>
        <NewGameForm seasonId={season.id} />
      </Card>
    </div>
  );
}
