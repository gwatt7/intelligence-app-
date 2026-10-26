import Link from "next/link";
import { format } from "date-fns";
import { Card, CardTitle } from "@/components/ui/Card";
import { TrendChart } from "@/components/charts/TrendChart";
import { SituationStats } from "@/components/stats/SituationStats";
import { cn } from "@/lib/cn";
import { formatPct } from "@/lib/stats";
import {
  count,
  faceoffPct,
  GAME_SITUATIONS,
  mergeTotals,
  emptyTotals,
  penaltyKillSummary,
  powerPlaySummary,
  VIEW_LABEL,
  type SituationTotals,
  type SituationView,
} from "@/lib/game-situations";
import type { AnalyticsGame } from "@/lib/game-situations-server";

const na = (v: number | null) => (v === null ? "N/A" : formatPct(v));
const gameLabel = (g: AnalyticsGame) => `${format(g.date, "MMM d")} ${g.homeAway === "AWAY" ? "at" : "vs"} ${g.opponent}`;
const result = (g: AnalyticsGame) =>
  g.ourScore === null || g.opponentScore === null ? "—" : `${g.ourScore > g.opponentScore ? "W" : g.ourScore < g.opponentScore ? "L" : "T"} ${g.ourScore}-${g.opponentScore}`;

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-2">{sub}</p>}
    </div>
  );
}

/** Team game statistics for the Analytics page — all from lib/game-situations.ts. */
export function GameAnalytics({ games, view, scopeLabel }: { games: AnalyticsGame[]; view: SituationView; scopeLabel: string }) {
  const totals: SituationTotals = games.reduce((acc, g) => mergeTotals(acc, g.totals), emptyTotals());
  const completed = games.filter((g) => g.ourScore !== null && g.opponentScore !== null);
  const w = completed.filter((g) => g.ourScore! > g.opponentScore!).length;
  const l = completed.filter((g) => g.ourScore! < g.opponentScore!).length;
  const t = completed.length - w - l;
  const gf = completed.reduce((a, g) => a + g.ourScore!, 0);
  const ga = completed.reduce((a, g) => a + g.opponentScore!, 0);

  const pp = powerPlaySummary(games.map((g) => g.special));
  const pk = penaltyKillSummary(games.map((g) => g.special));
  const multi = games.length > 1;

  return (
    <div className="space-y-6">
      {/* Results — final scores always include every situation */}
      <Card>
        <CardTitle>Game Results · {scopeLabel}</CardTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Metric label="Games with stats or results" value={games.length} />
          <Metric label="Record (W-L-T)" value={`${w}-${l}-${t}`} sub={`${completed.length} completed`} />
          <Metric label="Goals For" value={completed.length ? gf : "N/A"} sub="Final scores · all situations" />
          <Metric label="Goals Against" value={completed.length ? ga : "N/A"} sub="Final scores · all situations" />
          <Metric label="Goal Differential" value={completed.length ? `${gf - ga > 0 ? "+" : ""}${gf - ga}` : "N/A"} />
        </div>
      </Card>

      {/* Team stats for the selected situation */}
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">Team Statistics · {VIEW_LABEL[view]}</h3>
        <p className="mb-3 text-xs text-muted-2">
          {view === "ALL"
            ? "Every recorded 5-on-5, Power Play and Penalty Kill line added together once. Tags show which situations each number includes."
            : `Only events recorded during ${VIEW_LABEL[view]}. N/A = not recorded in this situation.`}{" "}
          Player-recorded goals can differ from final scores when a goal wasn&apos;t logged to a player line (e.g. 4-on-4 or shorthanded).
        </p>
        <SituationStats totals={totals} view={view} groups={["scoring", "faceoffs", "defense", "transition", "goaltending"]} titlePrefix="Team" />
      </div>

      {/* Faceoffs */}
      <Card>
        <CardTitle>Faceoff Analytics · {scopeLabel}</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Situation</th>
                <th className="py-2 pr-4 text-right">Won</th>
                <th className="py-2 pr-4 text-right">Lost</th>
                <th className="py-2 pr-4 text-right">Total</th>
                <th className="py-2 text-right">Win %</th>
              </tr>
            </thead>
            <tbody>
              {(["ALL", ...GAME_SITUATIONS] as SituationView[]).map((v) => {
                const won = count(totals, v, "faceoffsWon").value ?? 0;
                const lost = count(totals, v, "faceoffsLost").value ?? 0;
                return (
                  <tr key={v} className={cn("border-t border-border", v === view && "bg-accent/10")}>
                    <td className="py-2 pr-4 font-medium text-foreground">{VIEW_LABEL[v]}</td>
                    <td className="py-2 pr-4 text-right">{won}</td>
                    <td className="py-2 pr-4 text-right">{lost}</td>
                    <td className="py-2 pr-4 text-right">{won + lost}</td>
                    <td className="py-2 text-right font-semibold">{na(faceoffPct(totals, v).value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-2">Win % = won ÷ (won + lost). All Situations uses the combined counts, not an average of the rows.</p>
        {multi && (
          <div className="mt-4">
            <p className="mb-1 text-xs text-muted">Faceoff win % by game · {VIEW_LABEL[view]}</p>
            <TrendChart data={games.map((g) => ({ label: format(g.date, "MMM d"), value: faceoffPct(g.totals, view).value }))} unit="%" leftMargin={-6} />
          </div>
        )}
      </Card>

      {/* Power Play */}
      <Card>
        <CardTitle>Power Play Analytics · {scopeLabel}</CardTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Power Play %" value={na(pp.pct)} sub="PP goals ÷ PP opportunities" />
          <Metric label="Power-Play Goals" value={pp.gamesCounted ? pp.goals : "N/A"} sub="From players' PP stats" />
          <Metric label="Power-Play Opportunities" value={pp.gamesCounted ? pp.opportunities : "N/A"} />
          <Metric label="Games Counted" value={`${pp.gamesCounted} of ${games.length}`} sub="Games with opportunities recorded" />
        </div>
        {multi && pp.gamesCounted > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs text-muted">Power Play % by game</p>
            <TrendChart
              data={games.map((g) => ({ label: format(g.date, "MMM d"), value: g.special.powerPlayOpportunities === null ? null : powerPlaySummary([g.special]).pct }))}
              unit="%"
              leftMargin={-6}
            />
          </div>
        )}
      </Card>

      {/* Penalty Kill */}
      <Card>
        <CardTitle>Penalty Kill Analytics · {scopeLabel}</CardTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Metric label="Penalty Kill %" value={na(pk.pct)} sub="Successful kills ÷ times shorthanded" />
          <Metric label="Successful Kills" value={pk.gamesCounted ? pk.successfulKills : "N/A"} />
          <Metric label="Times Shorthanded" value={pk.gamesCounted ? pk.opportunities : "N/A"} sub="PK opportunities faced" />
          <Metric label="PP Goals Against" value={pk.gamesCounted ? pk.goalsAgainst : "N/A"} />
          <Metric label="Games Counted" value={`${pk.gamesCounted} of ${games.length}`} sub="Games with PK numbers recorded" />
        </div>
        <p className="mt-2 text-xs text-muted-2">
          Each power-play goal against counts as one unsuccessful kill (a minor penalty ends when the opponent scores), capped at the number of
          times shorthanded in that game.
        </p>
        {multi && pk.gamesCounted > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs text-muted">Penalty Kill % by game</p>
            <TrendChart
              data={games.map((g) => ({
                label: format(g.date, "MMM d"),
                value: g.special.penaltyKillOpportunities === null ? null : penaltyKillSummary([g.special]).pct,
              }))}
              unit="%"
              leftMargin={-6}
            />
          </div>
        )}
      </Card>

      {/* Game log for the selected situation */}
      {multi && (
        <Card padded={false}>
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardTitle>Game Log · {VIEW_LABEL[view]}</CardTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="p-3">Game</th>
                  <th className="p-3">Result</th>
                  <th className="p-3 text-right">Goals</th>
                  <th className="p-3 text-right">Shots</th>
                  <th className="p-3 text-right">FO W-L</th>
                  <th className="p-3 text-right">FO %</th>
                  <th className="p-3 text-right">Blocks</th>
                  <th className="p-3 text-right">PP</th>
                  <th className="p-3 text-right">PK</th>
                </tr>
              </thead>
              <tbody>
                {[...games].reverse().map((g) => {
                  const cell = (k: Parameters<typeof count>[2]) => count(g.totals, view, k).value ?? "N/A";
                  const ppG = powerPlaySummary([g.special]);
                  const pkG = penaltyKillSummary([g.special]);
                  return (
                    <tr key={g.id} className="border-b border-border last:border-b-0">
                      <td className="whitespace-nowrap p-3">
                        <Link href={`/analytics?game=${g.id}${view === "ALL" ? "" : `&situation=${view === "EVEN" ? "5v5" : view === "POWER_PLAY" ? "pp" : "pk"}`}`} className="font-medium text-foreground hover:text-accent-strong">
                          {gameLabel(g)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap p-3 text-muted">{result(g)}</td>
                      <td className="p-3 text-right">{cell("goals")}</td>
                      <td className="p-3 text-right">{cell("shots")}</td>
                      <td className="whitespace-nowrap p-3 text-right">
                        {count(g.totals, view, "faceoffsWon").value ?? 0}-{count(g.totals, view, "faceoffsLost").value ?? 0}
                      </td>
                      <td className="p-3 text-right">{na(faceoffPct(g.totals, view).value)}</td>
                      <td className="p-3 text-right">{cell("blocks")}</td>
                      <td className="whitespace-nowrap p-3 text-right text-muted">
                        {ppG.gamesCounted ? `${ppG.goals}/${ppG.opportunities}` : "—"}
                      </td>
                      <td className="whitespace-nowrap p-3 text-right text-muted">
                        {pkG.gamesCounted ? `${pkG.successfulKills}/${pkG.opportunities}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 pb-4 pt-2 text-xs text-muted-2 sm:px-5">PP = power-play goals / opportunities · PK = successful kills / times shorthanded · — = not recorded.</p>
        </Card>
      )}
    </div>
  );
}
