import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NewPracticeForm } from "@/components/forms/NewPracticeForm";

export default async function NewPracticePage() {
  const season = await getCurrentSeason();
  if (!season) redirect("/team");

  const last = await prisma.practice.findFirst({
    where: { seasonId: season.id },
    orderBy: { number: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Add Practice" subtitle={`Season ${season.name}`} />
      <Card>
        <NewPracticeForm
          seasonId={season.id}
          suggestedNumber={(last?.number ?? 0) + 1}
          suggestedWeek={last?.week ?? 1}
        />
      </Card>
    </div>
  );
}
