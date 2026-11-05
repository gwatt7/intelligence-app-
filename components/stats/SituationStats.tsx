import { Card, CardTitle } from "@/components/ui/Card";
import { formatPct } from "@/lib/stats";
import { formatIceTime } from "@/lib/situation-stats";
import {
  count,
  faceoffPct,
  points,
  savePercentage,
  shotAccuracy,
  shotConversion,
  sourcesLabel,
  VIEW_LABEL,
  zoneEntryRate,
  zoneExitRate,
  type CountKey,
  type SituationTotals,
  type SituationView,
  type StatValue,
} from "@/lib/game-situations";

type Item = { label: string; get: (t: SituationTotals, v: SituationView) => StatValue; kind?: "pct" | "time"; hint?: string };

const c = (key: CountKey) => (t: SituationTotals, v: SituationView) => count(t, v, key);

export const STAT_GROUPS = {
  scoring: {
    title: "Scoring & Shooting",
    items: [
      { label: "Goals", get: c("goals") },
      { label: "Assists", get: c("assists") },
      { label: "Points", get: points },
      { label: "Shots", get: c("shots"), hint: "On goal" },
      { label: "Shot Attempts", get: c("shotAttempts") },
      { label: "Shot Conversion %", get: shotConversion, kind: "pct", hint: "Goals ÷ shots" },
      { label: "Shot Accuracy %", get: shotAccuracy, kind: "pct", hint: "Shots ÷ attempts" },
      { label: "Scoring Chances", get: c("scoringChances") },
    ],
  },
  faceoffs: {
    title: "Faceoffs",
    items: [
      { label: "Faceoffs Won", get: c("faceoffsWon") },
      { label: "Faceoffs Lost", get: c("faceoffsLost") },
      { label: "Faceoff %", get: faceoffPct, kind: "pct" },
    ],
  },
  defense: {
    title: "Defense & Puck Play",
    items: [
      { label: "Blocks", get: c("blocks") },
      { label: "Clears", get: c("clears") },
      { label: "Hits", get: c("hits") },
      { label: "Disruptions", get: c("disruptions") },
      { label: "Giveaways", get: c("giveaways") },
    ],
  },
  transition: {
    title: "Transition",
    items: [
      { label: "Zone Entries", get: c("zoneEntries") },
      { label: "Successful Entries", get: c("successfulZoneEntries") },
      { label: "Zone Entry %", get: zoneEntryRate, kind: "pct" },
      { label: "Zone Exits", get: c("zoneExits") },
      { label: "Successful Exits", get: c("successfulZoneExits") },
      { label: "Zone Exit %", get: zoneExitRate, kind: "pct" },
    ],
  },
  goaltending: {
    title: "Goaltending",
    items: [
      { label: "Shots Against", get: c("shotsAgainst") },
      { label: "Saves", get: c("saves") },
      { label: "Goals Against", get: c("goalsAgainst") },
      { label: "Save %", get: savePercentage, kind: "pct" },
    ],
  },
  iceTime: {
    title: "Ice Time",
    items: [{ label: "Ice Time", get: c("timeOnIceSeconds"), kind: "time", hint: "min:sec" }],
  },
} satisfies Record<string, { title: string; items: Item[] }>;

export type StatGroupKey = keyof typeof STAT_GROUPS;

function display(item: Item, v: StatValue): string {
  if (v.value === null) return "N/A";
  if (item.kind === "pct") return formatPct(v.value);
  if (item.kind === "time") return formatIceTime(v.value);
  return String(v.value);
}

/**
 * Stat cards for one situation view. N/A means the stat isn't recorded in
 * that situation (or a percentage has no attempts). In All Situations each
 * value notes which situations it includes.
 */
export function SituationStats({
  totals,
  view,
  groups,
  titlePrefix,
}: {
  totals: SituationTotals;
  view: SituationView;
  groups: StatGroupKey[];
  titlePrefix?: string;
}) {
  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const group = STAT_GROUPS[g];
        // In a single-situation view, only show stats that situation records.
        const items = (group.items as Item[]).filter((item) => view === "ALL" || item.get(totals, view).sources.length > 0);
        if (items.length === 0) return null;
        return (
          <Card key={g}>
            <CardTitle>
              {titlePrefix ? `${titlePrefix} — ` : ""}
              {group.title}
            </CardTitle>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {items.map((item) => {
                const v = item.get(totals, view);
                const tag =
                  v.value === null
                    ? item.kind === "pct" && v.sources.length > 0
                      ? "No attempts yet"
                      : `Not recorded${view === "ALL" ? "" : ` at ${VIEW_LABEL[view]}`}`
                    : view === "ALL"
                      ? sourcesLabel(v.sources)
                      : item.hint;
                return (
                  <div key={item.label}>
                    <dt className="text-xs text-muted">{item.label}</dt>
                    <dd className={`mt-0.5 text-lg font-semibold ${v.value === null ? "text-muted-2" : "text-foreground"}`}>{display(item, v)}</dd>
                    {tag && <p className="text-[11px] text-muted-2">{tag}</p>}
                  </div>
                );
              })}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}
