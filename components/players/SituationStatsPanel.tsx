import { Card, CardTitle } from "@/components/ui/Card";
import { TrendChart } from "@/components/charts/TrendChart";
import { formatPct } from "@/lib/stats";
import {
  formatIceTime,
  shotAccuracyPct,
  shotConversionPct,
  situationFaceoffPct,
  situationPoints,
  sumSituationLines,
  SITUATION_LABEL,
  type Situation,
  type SituationLine,
} from "@/lib/situation-stats";

export interface SituationGameEntry {
  id: string;
  label: string; // e.g. "Oct 30 vs Bethel"
  stat: SituationLine;
}

const na = (v: number | null) => (v === null ? "N/A" : formatPct(v));

function StatGrid({ items }: { items: { label: string; value: string | number; hint?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs text-muted">{i.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold text-foreground">{i.value}</dd>
          {i.hint && <p className="text-[11px] text-muted-2">{i.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

/** Power Play or Penalty Kill view of a player's official game stats. Reads only that situation's rows. */
export function SituationStatsPanel({
  situation,
  entries,
  firstName,
  isGoalie,
}: {
  situation: Situation;
  entries: SituationGameEntry[];
  firstName: string;
  isGoalie: boolean;
}) {
  const label = SITUATION_LABEL[situation];

  if (isGoalie) {
    return (
      <Card>
        <p className="text-sm text-muted">{label} stats are tracked for skaters. Goalie stats are under 5-on-5.</p>
      </Card>
    );
  }

  const t = sumSituationLines(entries.map((e) => e.stat));
  const pp = situation === "POWER_PLAY";

  const sample = (
    <Card>
      <CardTitle>{label} Sample Size</CardTitle>
      <p className="text-3xl font-bold text-foreground">{entries.length}</p>
      <p className="mt-1 text-xs text-muted">Official games with {label} stats logged</p>
    </Card>
  );

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        {sample}
        <Card>
          <p className="text-sm text-muted">
            No {label} stats logged for {firstName} yet. Enter them on a game&apos;s page: open the player and choose {label}. All {label} values show
            N/A until then.
          </p>
        </Card>
      </div>
    );
  }

  const chart = entries.map((e) => ({
    label: e.label,
    value: pp ? situationPoints(e.stat) : e.stat.blocks + e.stat.clears,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sample}
        {pp ? (
          <>
            <Card>
              <CardTitle>PP Points</CardTitle>
              <p className="text-3xl font-bold text-foreground">{situationPoints(t)}</p>
              <p className="mt-1 text-xs text-muted">
                {t.goals} G · {t.assists} A
              </p>
            </Card>
            <Card>
              <CardTitle>PP Ice Time</CardTitle>
              <p className="text-3xl font-bold text-foreground">{formatIceTime(t.timeOnIceSeconds)}</p>
              <p className="mt-1 text-xs text-muted">Total (min:sec) · {formatIceTime(Math.round(t.timeOnIceSeconds / entries.length))} per game</p>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardTitle>PK Blocks + Clears</CardTitle>
              <p className="text-3xl font-bold text-foreground">{t.blocks + t.clears}</p>
              <p className="mt-1 text-xs text-muted">
                {t.blocks} blocks · {t.clears} clears
              </p>
            </Card>
            <Card>
              <CardTitle>PK Faceoff %</CardTitle>
              <p className="text-3xl font-bold text-foreground">{na(situationFaceoffPct(t))}</p>
              <p className="mt-1 text-xs text-muted">
                {t.faceoffsWon} won · {t.faceoffsLost} lost
              </p>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardTitle>{label} Totals</CardTitle>
        {pp ? (
          <StatGrid
            items={[
              { label: "Goals", value: t.goals },
              { label: "Assists", value: t.assists },
              { label: "Points", value: situationPoints(t) },
              { label: "Shots", value: t.shots, hint: "On goal" },
              { label: "Shot Attempts", value: t.shotAttempts },
              { label: "Faceoffs Won", value: t.faceoffsWon },
              { label: "Faceoffs Lost", value: t.faceoffsLost },
              { label: "Faceoff %", value: na(situationFaceoffPct(t)) },
              { label: "Shot Conversion %", value: na(shotConversionPct(t)), hint: "Goals ÷ shots" },
              { label: "Shot Accuracy %", value: na(shotAccuracyPct(t)), hint: "Shots ÷ attempts" },
              { label: "PP Ice Time", value: formatIceTime(t.timeOnIceSeconds), hint: "min:sec" },
            ]}
          />
        ) : (
          <StatGrid
            items={[
              { label: "Blocks", value: t.blocks },
              { label: "Clears", value: t.clears },
              { label: "Faceoffs Won", value: t.faceoffsWon },
              { label: "Faceoffs Lost", value: t.faceoffsLost },
              { label: "Faceoff %", value: na(situationFaceoffPct(t)) },
            ]}
          />
        )}
      </Card>

      <Card>
        <CardTitle>{pp ? "PP Points by Game" : "PK Blocks + Clears by Game"}</CardTitle>
        <TrendChart data={chart} />
      </Card>

      <Card>
        <CardTitle>{label} Game Log</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Game</th>
                {pp ? (
                  <>
                    <th className="py-2 pr-4">G</th>
                    <th className="py-2 pr-4">A</th>
                    <th className="py-2 pr-4">P</th>
                    <th className="py-2 pr-4">Shots</th>
                    <th className="py-2 pr-4">Attempts</th>
                    <th className="py-2 pr-4">FO</th>
                    <th className="py-2 pr-4">Ice Time</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 pr-4">Blocks</th>
                    <th className="py-2 pr-4">Clears</th>
                    <th className="py-2 pr-4">FO</th>
                    <th className="py-2 pr-4">FO %</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {[...entries].reverse().map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="whitespace-nowrap py-2 pr-4 text-muted">{e.label}</td>
                  {pp ? (
                    <>
                      <td className="py-2 pr-4">{e.stat.goals}</td>
                      <td className="py-2 pr-4">{e.stat.assists}</td>
                      <td className="py-2 pr-4">{situationPoints(e.stat)}</td>
                      <td className="py-2 pr-4">{e.stat.shots}</td>
                      <td className="py-2 pr-4">{e.stat.shotAttempts}</td>
                      <td className="whitespace-nowrap py-2 pr-4">
                        {e.stat.faceoffsWon}-{e.stat.faceoffsLost}
                      </td>
                      <td className="py-2 pr-4">{formatIceTime(e.stat.timeOnIceSeconds)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 pr-4">{e.stat.blocks}</td>
                      <td className="py-2 pr-4">{e.stat.clears}</td>
                      <td className="whitespace-nowrap py-2 pr-4">
                        {e.stat.faceoffsWon}-{e.stat.faceoffsLost}
                      </td>
                      <td className="py-2 pr-4">{na(situationFaceoffPct(e.stat))}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-2">
        {label} stats are stored separately and never counted in 5-on-5 totals, percentages, rankings or analytics. Mini Games aren&apos;t split by
        situation; they appear under 5-on-5.
      </p>
    </div>
  );
}
