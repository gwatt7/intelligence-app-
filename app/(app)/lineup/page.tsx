import Link from "next/link";
import { format } from "date-fns";
import { RefreshCw, RotateCcw } from "lucide-react";
import { getCurrentSeason } from "@/lib/season";
import { getLineup } from "@/lib/lineup-builder-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { DefensePairCard, ForwardLineCard, PlayerRow, Rating } from "@/components/lineup/LineupViews";

export default async function LineupPage({ searchParams }: { searchParams: Promise<{ option?: string }> }) {
  const season = await getCurrentSeason();
  if (!season) {
    return (
      <div>
        <PageHeader title="Lineup Builder" />
        <EmptyState title="No season set up yet" description="Set up your season and team to get started." />
      </div>
    );
  }

  const { result, nextGame, gamesPlayed, lastSeasonName } = await getLineup(season.id, season.name);
  const { options, goalies, out, warnings } = result;

  if (!options.length) {
    return (
      <div>
        <PageHeader title="Lineup Builder" />
        <EmptyState title="Not enough players" description="Add skaters to the roster to build a lineup." />
      </div>
    );
  }

  // ?option=N (1-based) picks one of the alternative lineups.
  const requested = Number((await searchParams).option ?? "1");
  const index = Number.isInteger(requested) && requested >= 1 && requested <= options.length ? requested - 1 : 0;
  const option = options[index];
  const best = options[0];
  const nextIndex = (index + 1) % options.length;
  const pctOfBest = best.score > 0 ? Math.round((option.score / best.score) * 1000) / 10 : 100;

  const subtitle = nextGame
    ? `For the next game: ${nextGame.homeAway === "AWAY" ? "at" : "vs"} ${nextGame.opponent} · ${format(nextGame.date, "EEE, MMM d")}`
    : "Best lineup from everything logged so far";

  return (
    <div className="space-y-6">
      <PageHeader title="Lineup Builder" subtitle={subtitle} />

      {/* Option switcher */}
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {index === 0 ? "Best lineup" : `Option ${index + 1}`}
            <span className="ml-2 font-normal text-muted">
              {index === 0 ? `· ${options.length} options available` : `· ${pctOfBest}% as strong as the best lineup`}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Updates automatically as stats are entered · {gamesPlayed} game{gamesPlayed === 1 ? "" : "s"} played this season
            {lastSeasonName ? ` · ${lastSeasonName} stats used as a starting point` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {index > 0 && (
            <ButtonLink href="/lineup" variant="ghost" className="gap-1.5">
              <RotateCcw className="h-4 w-4" aria-hidden />
              Back to best lineup
            </ButtonLink>
          )}
          {options.length > 1 && (
            <ButtonLink href={nextIndex === 0 ? "/lineup" : `/lineup?option=${nextIndex + 1}`} className="gap-1.5">
              <RefreshCw className="h-4 w-4" aria-hidden />
              New lineup
            </ButtonLink>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section aria-labelledby="fwd-h" className="space-y-3">
            <h2 id="fwd-h" className="text-xs font-semibold uppercase tracking-widest text-muted">
              Forward Lines
            </h2>
            {option.forwards.map((l) => (
              <ForwardLineCard key={l.number} line={l} />
            ))}
          </section>

          <section aria-labelledby="def-h" className="space-y-3">
            <h2 id="def-h" className="text-xs font-semibold uppercase tracking-widest text-muted">
              Defense Pairs
            </h2>
            {option.defense.map((d) => (
              <DefensePairCard key={d.number} pair={d} />
            ))}
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardTitle>Goalies</CardTitle>
            {goalies.starter ? (
              <div className="space-y-1">
                <PlayerRow p={goalies.starter} right={<span className="text-xs font-semibold text-accent-strong">Starter</span>} />
                {goalies.backup && <PlayerRow p={goalies.backup} right={<span className="text-xs text-muted">Backup</span>} />}
                {goalies.others.map((g) => (
                  <PlayerRow key={g.id} p={g} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No available goalies.</p>
            )}
          </Card>

          <Card>
            <CardTitle>Extras</CardTitle>
            {option.extras.length ? (
              <div className="space-y-1">
                {option.extras.map((p) => (
                  <PlayerRow key={p.id} p={p} right={<Rating value={p.ratings.overall} />} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Everyone available is in the lineup.</p>
            )}
          </Card>

          {out.length > 0 && (
            <Card>
              <CardTitle>Out</CardTitle>
              <div className="space-y-1">
                {out.map((o) => (
                  <PlayerRow key={o.player.id} p={o.player} right={<span className="shrink-0 text-xs text-negative">{o.reason}</span>} />
                ))}
              </div>
            </Card>
          )}

          {warnings.length > 0 && (
            <Card>
              <CardTitle>Notes</CardTitle>
              <ul className="space-y-2">
                {warnings.map((w) => (
                  <li key={w} className="text-xs text-muted">
                    {w}
                  </li>
                ))}
              </ul>
              <Link href="/team" className="mt-3 inline-block text-xs font-medium text-accent-strong hover:underline">
                Edit positions on the Team page →
              </Link>
            </Card>
          )}

          <Card>
            <CardTitle>How it&apos;s built</CardTitle>
            <ul className="space-y-1.5 text-xs text-muted">
              <li>Players are rated 0–100 against teammates on scoring, playmaking, defense, physical play, transition and faceoffs. Recent games count a little more.</li>
              <li>Each player goes to their set position, on their natural side where possible.</li>
              <li>Lines pair a shooter with a playmaker and include a defensively responsible player; D pairs mix a puck-mover with a stay-at-home defender.</li>
              <li>Injured or unavailable players, and anyone marked scratched or injured for the next game, are left out. Regulars get priority.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
