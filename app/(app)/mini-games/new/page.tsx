import { getCurrentSeason } from "@/lib/season";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NewMiniGameForm } from "@/components/forms/NewMiniGameForm";

export default async function NewMiniGamePage() {
  const season = await getCurrentSeason();
  if (!season) redirect("/team");

  return (
    <div className="space-y-6">
      <PageHeader title="Add Mini Game" subtitle={`Season ${season.name}`} />
      <Card>
        <NewMiniGameForm seasonId={season.id} />
      </Card>
    </div>
  );
}
