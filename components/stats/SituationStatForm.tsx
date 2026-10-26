"use client";

import { useActionState, useTransition } from "react";
import { Field, Input } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/actions/team";
import { formatIceTime, SITUATION_FIELDS, SITUATION_LABEL, type Situation, type SituationLine } from "@/lib/situation-stats";

const initialState: ActionResult = { ok: true };

/** Power Play or Penalty Kill entry form for one player in one official game. Saves to its own table, never the 5-on-5 line. */
export function SituationStatForm({
  situation,
  stat,
  save,
  clear,
}: {
  situation: Situation;
  stat?: SituationLine;
  save: (situation: Situation, formData: FormData) => Promise<ActionResult>;
  clear: (situation: Situation) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => save(situation, formData), initialState);
  const [clearing, startClear] = useTransition();
  const label = SITUATION_LABEL[situation];

  return (
    <form action={formAction}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {SITUATION_FIELDS[situation].map((f) =>
          f.key === "timeOnIceSeconds" ? (
            <Field key={f.key} label={f.label} htmlFor={`${situation}-timeOnIce`} hint={f.hint}>
              <Input
                id={`${situation}-timeOnIce`}
                name="timeOnIce"
                inputMode="numeric"
                placeholder="0:00"
                defaultValue={stat ? formatIceTime(stat.timeOnIceSeconds) : ""}
              />
            </Field>
          ) : (
            <Field key={f.key} label={f.label} htmlFor={`${situation}-${f.key}`} hint={f.hint}>
              <Input id={`${situation}-${f.key}`} name={f.key} type="number" min={0} defaultValue={stat?.[f.key] ?? 0} />
            </Field>
          )
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : `Save ${label} Stats`}
        </Button>
        {stat && (
          <Button
            type="button"
            variant="ghost"
            disabled={clearing}
            onClick={() => {
              if (confirm(`Delete this player's ${label} stats for this game?`)) startClear(async () => void (await clear(situation)));
            }}
          >
            {clearing ? "Deleting…" : `Delete ${label} Stats`}
          </Button>
        )}
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
