import { useState } from "react";
import { Field, Input } from "@/components/forms/Field";
import { formatIceTime } from "@/lib/situation-stats";

type RawStatLine = {
  zoneEntries: number;
  successfulZoneEntries: number;
  zoneExits: number;
  successfulZoneExits: number;
  goals: number;
  assists: number;
  shots: number;
  shotAttempts: number;
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
  kills: number;
  freezes: number;
  freezeOpportunities: number;
  wins: number;
  losses: number;
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
  { key: "shotAttempts", label: "Shot Attempts" },
];

const DEFENSE_FIELDS: FieldDef[] = [
  { key: "disruptions", label: "Disruptions" },
  { key: "hits", label: "Hits" },
  { key: "blocks", label: "Blocks" },
  { key: "giveaways", label: "Giveaways" },
];

// Forwards only — Faceoff % (Won ÷ (Won + Lost) × 100) is always computed
// from these two counts, never entered directly (see lib/stats.ts).
const FACEOFF_FIELDS: FieldDef[] = [
  { key: "faceoffsWon", label: "Faceoffs Won" },
  { key: "faceoffsLost", label: "Faceoffs Lost" },
];

// Freeze % (Freezes ÷ Freeze Opportunities × 100) and Win % (Wins ÷ (Wins +
// Losses) × 100) are always computed from their raw counts, never entered
// directly (see lib/stats.ts) — same pattern as Faceoff % above.
const GOALIE_FIELDS: FieldDef[] = [
  { key: "shotsAgainst", label: "Shots Against" },
  { key: "goalsAgainst", label: "Goals Against" },
  { key: "saves", label: "Saves" },
  { key: "kills", label: "Kills" },
  { key: "freezes", label: "Freezes" },
  { key: "freezeOpportunities", label: "Freeze Opportunities" },
  { key: "wins", label: "Wins" },
  { key: "losses", label: "Losses" },
];

// Exactly the fields a "Did Not Track" toggle applies to — Goals/Assists
// are excluded (see lib/stats.ts's NOT_TRACKED_TOGGLE_FIELDS, the single
// source of truth the server action reads the same list from).
const NOT_TRACKABLE: ReadonlySet<string> = new Set([
  ...TRANSITION_FIELDS.map((f) => f.key),
  "shots",
  "shotAttempts",
  ...DEFENSE_FIELDS.map((f) => f.key),
  ...FACEOFF_FIELDS.map((f) => f.key),
  ...GOALIE_FIELDS.map((f) => f.key),
]);

/**
 * One field's number input, plus (official Games only) a small "Did Not
 * Track" checkbox beside it. Checking it disables and dims the input and
 * swaps its value display to "NT" — the actual number submitted when
 * checked doesn't matter (the server forces it to 0 and records the field
 * name in untrackedFields instead; see saveGamePlayerStat), so the input is
 * disabled only to make that visually unambiguous, not because the typed
 * value is read.
 */
function TrackableInput({ fieldKey, defaultValue, initiallyUntracked }: { fieldKey: string; defaultValue: number; initiallyUntracked: boolean }) {
  const [notTracked, setNotTracked] = useState(initiallyUntracked);
  return (
    <div className="flex items-end gap-1.5">
      <div className="flex-1">
        {notTracked ? (
          <input type="text" value="NT" disabled className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-2" />
        ) : (
          <Input id={fieldKey} name={fieldKey} type="number" min={0} defaultValue={defaultValue} />
        )}
      </div>
      <label className="flex shrink-0 items-center gap-1 pb-2 text-[11px] text-muted-2" title="Did Not Track">
        <input type="checkbox" name={`nt_${fieldKey}`} checked={notTracked} onChange={(e) => setNotTracked(e.target.checked)} className="h-3.5 w-3.5 accent-accent" />
        NT
      </label>
    </div>
  );
}

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
  untrackedFields,
  showNotTracked,
}: {
  title: string;
  fields: FieldDef[];
  defaults?: Partial<RawStatLine>;
  visible: boolean;
  untrackedFields?: ReadonlySet<string>;
  showNotTracked?: boolean;
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
        {fields.map((f) =>
          showNotTracked && NOT_TRACKABLE.has(f.key) ? (
            <Field key={f.key} label={f.label} htmlFor={f.key}>
              <TrackableInput fieldKey={f.key} defaultValue={defaults?.[f.key] ?? 0} initiallyUntracked={!!untrackedFields?.has(f.key)} />
            </Field>
          ) : (
            <Field key={f.key} label={f.label} htmlFor={f.key}>
              <Input id={f.key} name={f.key} type="number" min={0} defaultValue={defaults?.[f.key] ?? 0} />
            </Field>
          )
        )}
      </div>
    </div>
  );
}

export function StatLineFields({
  defaults,
  isGoalie,
  isForward,
  showIceTime,
  iceTimeSeconds,
  showPlusMinus,
  plusMinusValue,
  showNotTracked,
  untrackedFields,
}: {
  defaults?: Partial<RawStatLine>;
  isGoalie?: boolean;
  isForward?: boolean;
  /** 5-on-5 Ice Time — official Games only (StatEntryList passes this); Mini
   * Games (PlayerMiniGameStatForm) never do, since MiniGamePlayerStat has no
   * time-on-ice field. */
  showIceTime?: boolean;
  iceTimeSeconds?: number;
  /** Plus/Minus — official Games only, skaters only (never shown for a
   * goalie, regardless of this flag). Mini Games never pass this, same
   * reasoning as showIceTime above. */
  showPlusMinus?: boolean;
  plusMinusValue?: number;
  /** "Did Not Track" per-field toggles — official Games only, same reasoning as showIceTime above. */
  showNotTracked?: boolean;
  /** Which fields are currently flagged Did Not Track, so reopening a game keeps them checked. */
  untrackedFields?: readonly string[];
}) {
  // Transition/Offense/Defense are skater categories — a goalie's stat
  // line is Goaltending only, per the app's position-based stat rules.
  const isSkater = !isGoalie;
  const untrackedSet = new Set(untrackedFields ?? []);

  return (
    <div className="space-y-5">
      {(showIceTime || (showPlusMinus && isSkater)) && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Ice Time &amp; Plus/Minus</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {showIceTime && (
              <Field label="5-on-5 Ice Time" htmlFor="timeOnIce" hint="mm:ss">
                <Input
                  id="timeOnIce"
                  name="timeOnIce"
                  inputMode="numeric"
                  placeholder="0:00"
                  defaultValue={iceTimeSeconds !== undefined ? formatIceTime(iceTimeSeconds) : ""}
                />
              </Field>
            )}
            {showPlusMinus && isSkater && (
              <Field label="Plus/Minus" htmlFor="plusMinus" hint="e.g. 2 or -1">
                <Input id="plusMinus" name="plusMinus" type="number" step={1} defaultValue={plusMinusValue ?? 0} />
              </Field>
            )}
          </div>
        </div>
      )}
      <FieldGroup title="Transition" fields={TRANSITION_FIELDS} defaults={defaults} visible={isSkater} showNotTracked={showNotTracked} untrackedFields={untrackedSet} />
      <FieldGroup title="Offense" fields={OFFENSE_FIELDS} defaults={defaults} visible={isSkater} showNotTracked={showNotTracked} untrackedFields={untrackedSet} />
      <FieldGroup title="Defense" fields={DEFENSE_FIELDS} defaults={defaults} visible={isSkater} showNotTracked={showNotTracked} untrackedFields={untrackedSet} />
      <FieldGroup title="Faceoffs" fields={FACEOFF_FIELDS} defaults={defaults} visible={!!isForward} showNotTracked={showNotTracked} untrackedFields={untrackedSet} />
      <FieldGroup title="Goaltending" fields={GOALIE_FIELDS} defaults={defaults} visible={!!isGoalie} showNotTracked={showNotTracked} untrackedFields={untrackedSet} />
    </div>
  );
}
