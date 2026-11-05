"use client";

import { startTransition, useActionState } from "react";
import { Field, Input } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/actions/team";

const initialState: ActionResult = { ok: true };

/** Team special-teams box score for one game. Blank boxes = not recorded. */
export function SpecialTeamsForm({
  save,
  powerPlayOpportunities,
  penaltyKillOpportunities,
  powerPlayGoalsAgainst,
  powerPlayGoals,
}: {
  save: (formData: FormData) => Promise<ActionResult>;
  powerPlayOpportunities: number | null;
  penaltyKillOpportunities: number | null;
  powerPlayGoalsAgainst: number | null;
  powerPlayGoals: number;
}) {
  const [state, formAction, pending] = useActionState(async (_p: ActionResult, fd: FormData) => save(fd), initialState);
  const num = (v: number | null) => (v === null ? "" : String(v));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        // Submit without React's automatic form reset, so typed values stay if the save is rejected.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Power-Play Opportunities" htmlFor="powerPlayOpportunities" hint="Our power plays this game">
          <Input id="powerPlayOpportunities" name="powerPlayOpportunities" type="number" min={0} max={99} placeholder="Not recorded" defaultValue={num(powerPlayOpportunities)} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Power-Play Goals</span>
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">{powerPlayGoals}</p>
          <p className="text-xs text-muted">From players&apos; Power Play stats below</p>
        </div>
        <Field label="Times Shorthanded" htmlFor="penaltyKillOpportunities" hint="Opponent power plays (PK opportunities)">
          <Input id="penaltyKillOpportunities" name="penaltyKillOpportunities" type="number" min={0} max={99} placeholder="Not recorded" defaultValue={num(penaltyKillOpportunities)} />
        </Field>
        <Field label="Power-Play Goals Against" htmlFor="powerPlayGoalsAgainst" hint="Goals the opponent scored on their power plays">
          <Input id="powerPlayGoalsAgainst" name="powerPlayGoalsAgainst" type="number" min={0} max={99} placeholder="Not recorded" defaultValue={num(powerPlayGoalsAgainst)} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Special Teams"}
        </Button>
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
        <p className="text-xs text-muted-2">Leave a box blank if it wasn&apos;t tracked — blanks are excluded from PP% and PK%, never counted as 0.</p>
      </div>
    </form>
  );
}
