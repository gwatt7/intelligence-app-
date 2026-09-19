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

type FieldDef = { key: keyof RawStatLine; label: string };

const TRANSITION_FIELDS: FieldDef[] = [
  { key: "zoneEntries", label: "Zone Entries" },
  { key: "successfulZoneEntries", label: "Successful Zone Entries" },
  { key: "zoneExits", label: "Zone Exits" },
  { key: "successfulZoneExits", label: "Successful Zone Exits" },
];

const OFFENSE_FIELDS: FieldDef[] = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "shots", label: "Shots" },
  { key: "scoringChances", label: "Scoring Chances" },
  { key: "goodOpportunities", label: "Good Opportunities" },
  { key: "badOpportunities", label: "Bad Opportunities" },
];

const DEFENSE_FIELDS: FieldDef[] = [
  { key: "disruptions", label: "Disruptions" },
  { key: "hits", label: "Hits" },
  { key: "blocks", label: "Blocks" },
  { key: "takeaways", label: "Takeaways" },
  { key: "giveaways", label: "Giveaways" },
];

// Forwards only — Faceoff % (Won ÷ (Won + Lost) × 100) is always computed
// from these two counts, never entered directly (see lib/stats.ts).
const FACEOFF_FIELDS: FieldDef[] = [
  { key: "faceoffsWon", label: "Faceoffs Won" },
  { key: "faceoffsLost", label: "Faceoffs Lost" },
];

const GOALIE_FIELDS: FieldDef[] = [
  { key: "shotsAgainst", label: "Shots Against" },
  { key: "goalsAgainst", label: "Goals Against" },
  { key: "saves", label: "Saves" },
];

/**
 * One stat group — either the normal visible inputs, or (when `visible` is
 * false) the same fields as hidden inputs carrying their existing value
 * unchanged. A goalie's form never shows Offense/Defense/Transition/
 * Faceoffs, but the save still submits those keys at whatever they already
 * were (almost always 0) rather than omitting them — omitting them would
 * let statLineSchema's per-field default silently zero out any existing
 * value on save, which is real data loss the position-based hide must
 * never cause. Same reasoning protects Goaltending fields on a skater's
 * form and Faceoffs fields on a non-forward's form.
 */
function FieldGroup({
  title,
  fields,
  defaults,
  visible,
}: {
  title: string;
  fields: FieldDef[];
  defaults?: Partial<RawStatLine>;
  visible: boolean;
}) {
  if (!visible) {
    return (
      <>
        {fields.map((f) => (
          <input key={f.key} type="hidden" name={f.key} value={defaults?.[f.key] ?? 0} />
        ))}
      </>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={f.key}>
            <Input id={f.key} name={f.key} type="number" min={0} defaultValue={defaults?.[f.key] ?? 0} />
          </Field>
        ))}
      </div>
    </div>
  );
}

export function StatLineFields({
  defaults,
  isGoalie,
  isForward,
}: {
  defaults?: Partial<RawStatLine>;
  isGoalie?: boolean;
  isForward?: boolean;
}) {
  // Transition/Offense/Defense are skater categories — a goalie's stat
  // line is Goaltending only, per the app's position-based stat rules.
  const isSkater = !isGoalie;

  return (
    <div className="space-y-5">
      <FieldGroup title="Transition" fields={TRANSITION_FIELDS} defaults={defaults} visible={isSkater} />
      <FieldGroup title="Offense" fields={OFFENSE_FIELDS} defaults={defaults} visible={isSkater} />
      <FieldGroup title="Defense" fields={DEFENSE_FIELDS} defaults={defaults} visible={isSkater} />
      <FieldGroup title="Faceoffs" fields={FACEOFF_FIELDS} defaults={defaults} visible={!!isForward} />
      <FieldGroup title="Goaltending" fields={GOALIE_FIELDS} defaults={defaults} visible={!!isGoalie} />
    </div>
  );
}
