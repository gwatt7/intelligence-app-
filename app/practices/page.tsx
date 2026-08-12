import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { format } from "date-fns";

export default async function PracticesPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Practices" />
        <EmptyState
          title="No season yet"
          description="Set up your season and team first."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      </div>
    );
  }

  const practices = await prisma.practice.findMany({
    where: { seasonId: season.id },
    orderBy: [{ week: "asc" }, { number: "asc" }],
    include: { _count: { select: { playerStats: true } } },
  });

  const byWeek = new Map<number, typeof practices>();
  for (const p of practices) {
    byWeek.set(p.week, [...(byWeek.get(p.week) ?? []), p]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practices"
        subtitle={`Season ${season.name}`}
        actions={<ButtonLink href="/practices/new">+ Add Practice</ButtonLink>}
      />

      {practices.length === 0 ? (
        <EmptyState title="No practices yet" description="Create your first practice to start logging stats." />
      ) : (
        <div className="space-y-6">
          {[...byWeek.entries()].map(([week, weekPractices]) => (
            <div key={week}>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Week {week}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {weekPractices.map((p) => (
                  <Link key={p.id} href={`/practices/${p.id}`}>
                    <Card className="hover:border-accent/50 transition-colors h-full">
                      <p className="font-medium text-foreground">Practice {p.number}</p>
                      <p className="text-xs text-muted mt-1">{format(p.date, "MMM d, yyyy")}</p>
                      {p.focus && <p className="text-xs text-muted mt-1 line-clamp-1">{p.focus}</p>}
                      <p className="text-xs text-muted-2 mt-2">{p._count.playerStats} player(s) logged</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
