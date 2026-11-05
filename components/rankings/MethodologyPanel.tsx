import {
  GOALIE_CATEGORIES,
  GOALIE_MIN_SHOTS,
  GOALIE_WEIGHTS,
  MIN_GAMES_FOR_RANKING,
  MIN_SKATERS_FOR_COMPARISON,
  MIN_WEIGHT_COVERAGE,
  SKATER_CATEGORIES,
  SKATER_WEIGHTS,
} from "@/lib/overall-rankings";

/** How the ratings are calculated — rendered straight from the configuration in lib/overall-rankings.ts. */
export function MethodologyPanel({ group }: { group: "skaters" | "goalies" }) {
  const pct = (w: number | undefined) => (w === undefined ? "—" : `${Math.round(w * 100)}%`);

  return (
    <details className="rounded-xl border border-border bg-surface">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-raised">
        How the {group === "skaters" ? "Skater" : "Goalie"} Overall Rating is calculated
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-4 text-sm text-muted">
        {group === "skaters" ? (
          <>
            <p>
              Each category is scored 0–100 <strong className="text-foreground">relative to the other skaters</strong> in the same period: 50 is the
              team average, and scores are based on how far a player is above or below it (converted to a percentile). The rating is the weighted
              average of the category scores. Forwards and defensemen are ranked together but use different weights.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-xs">
                <thead>
                  <tr className="text-left uppercase tracking-wide text-muted-2">
                    <th className="py-1.5 pr-3 font-medium">Category</th>
                    <th className="py-1.5 pr-3 font-medium">Measured as</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Forwards</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Defense</th>
                    <th className="py-1.5 font-medium">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {SKATER_CATEGORIES.map((c) => (
                    <tr key={c.key}>
                      <td className="py-2 pr-3 font-medium text-foreground">{c.label}</td>
                      <td className="py-2 pr-3">{c.measure}</td>
                      <td className="py-2 pr-3 text-right font-mono text-foreground">{pct(SKATER_WEIGHTS.FORWARD[c.key])}</td>
                      <td className="py-2 pr-3 text-right font-mono text-foreground">{pct(SKATER_WEIGHTS.DEFENSE[c.key])}</td>
                      <td className="py-2">{c.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <p>
              Goalies are rated with their own model and never compared with skaters. Save percentage and goals against use fixed scales; kills are
              compared with the goalie group&apos;s average. Freezes are not used. Wins and losses are shown for context but don&apos;t affect the
              rating, so a goalie isn&apos;t rewarded just for playing behind a stronger team.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead>
                  <tr className="text-left uppercase tracking-wide text-muted-2">
                    <th className="py-1.5 pr-3 font-medium">Category</th>
                    <th className="py-1.5 pr-3 font-medium">Measured as</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Weight</th>
                    <th className="py-1.5 font-medium">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {GOALIE_CATEGORIES.map((c) => (
                    <tr key={c.key}>
                      <td className="py-2 pr-3 font-medium text-foreground">{c.label}</td>
                      <td className="py-2 pr-3">{c.measure}</td>
                      <td className="py-2 pr-3 text-right font-mono text-foreground">{pct(GOALIE_WEIGHTS[c.key])}</td>
                      <td className="py-2">{c.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div>
          <p className="mb-1 font-medium text-foreground">Fairness safeguards</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Small samples are blended toward the group average before scoring, so a hot game or two can&apos;t produce an extreme rating.</li>
            <li>
              A full rank needs at least {MIN_GAMES_FOR_RANKING} games (or practice sessions)
              {group === "goalies"
                ? `, plus ${GOALIE_MIN_SHOTS.season} shots faced in games (${GOALIE_MIN_SHOTS.practice} in practice)`
                : `, and at least ${MIN_SKATERS_FOR_COMPARISON} skaters with data to compare against`}
              . Below that, players are listed as <em>Provisional</em> rather than ranked.
            </li>
            <li>
              Missing data is never treated as zero. A stat nobody recorded in the period is left out, and a category with no attempts (e.g. no zone
              entries) is excluded for that player, with the remaining weights re-balanced. Ratings with less than {Math.round(MIN_WEIGHT_COVERAGE * 100)}%
              of their category weight available are provisional.
            </li>
            <li>Players with no stats in the period stay on the list as &ldquo;Not yet rated&rdquo;.</li>
            <li>Rank movement compares with the rankings just before the most recent game or practice session.</li>
          </ul>
        </div>
        <p className="text-xs text-muted-2">
          These weights are an initial coaching judgment, not a scientifically validated model. They live in one place (lib/overall-rankings.ts) so they
          can be tuned.
        </p>
      </div>
    </details>
  );
}
