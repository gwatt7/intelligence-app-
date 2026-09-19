import { Field, Input } from "@/components/forms/Field";

type RawStatLine = {
  zoneEntries: number;
  successfulZoneEntries: number;
  zoneExits: number;
  successfulZoneExits: number;
  goals: number;
  assists: number;
  shots: number;
  scoringChances: number;
  goodOpportunities: number;
  badOpportunities: number;
  disruptions: number;
  hits: number;
  blocks: number;
  takeaways: number;
  giveaways: number;
  faceoffsWon: number;
  faceoffsLost: number;
  shotsAgainst: number;
  goalsAgainst: number;
  saves: number;
};

const NUM_FIELDS: { key: keyof RawStatLine; label: string }[][] = [
  [
    { key: "zoneEntries", label: "Zone Entries" },
    { key: "successfulZoneEntries", label: "Successful Zone Entries" },
    { key: "zoneExits", label: "Zone Exits" },
    { key: "successfulZoneExits", label: "Successful Zone Exits" },
  ],
  [
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
    { key: "shots", label: "Shots" },
    { key: "scoringChances", label: "Scoring Chances" },
    { key: "goodOpportunities", label: "Good Opportunities" },
    { key: "badOpportunities", label: "Bad Opportunities" },
  ],
  [
    { key: "disruptions", label: "Disruptions" },
    { key: "hits", label: "Hits" },
    { key: "blocks", label: "Blocks" },
    { key: "takeaways", label: "Takeaways" },
    { key: "giveaways", label: "Giveaways" },
  ],
];

const GOALIE_FIELDS: { key: keyof RawStatLine; label: string }[] = [
  { key: "shotsAgainst", label: "Shots Against" },
  { key: "goalsAgainst", label: "Goals Against" },
  { key: "saves", label: "Saves" },
];

// Forwards only — Faceoff % (Won ÷ (Won + Lost) × 100) is always computed
// from these two counts, never entered directly (see lib/stats.ts).
const FACEOFF_FIELDS: { key: keyof RawStatLine; label: string }[] = [
  { key: "faceoffsWon", label: "Faceoffs Won" },
  { key: "faceoffsLost", label: "Faceoffs Lost" },
];

const GROUP_TITLES = ["Transition", "Offense", "Defense"];

export function StatLineFields({
  defaults,
  isGoalie,
  isForward,
}: {
  defaults?: Partial<RawStatLine>;
  isGoalie?: boolean;
  isForward?: boolean;
}) {
  return (
    <div className="space-y-5">
      {NUM_FIELDS.map((group, i) => (
        <div key={GROUP_TITLES[i]}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">{GROUP_TITLES[i]}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {group.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={f.key}>
                <Input
                  id={f.key}
                  name={f.key}
                  type="number"
                  min={0}
                  defaultValue={defaults?.[f.key] ?? 0}
                />
              </Field>
            ))}
          </div>
        </div>
      ))}
      {isForward && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Faceoffs</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {FACEOFF_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={f.key}>
                <Input
                  id={f.key}
                  name={f.key}
                  type="number"
                  min={0}
                  defaultValue={defaults?.[f.key] ?? 0}
                />
              </Field>
            ))}
          </div>
        </div>
      )}
      {isGoalie && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Goaltending</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {GOALIE_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={f.key}>
                <Input
                  id={f.key}
                  name={f.key}
                  type="number"
                  min={0}
                  defaultValue={defaults?.[f.key] ?? 0}
                />
              </Field>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
