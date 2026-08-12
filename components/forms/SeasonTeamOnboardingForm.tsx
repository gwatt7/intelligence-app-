"use client";

import { useActionState } from "react";
import { createSeasonWithTeam, type ActionResult } from "@/lib/actions/team";
import { Field, Input } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

export function SeasonTeamOnboardingForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createSeasonWithTeam(formData),
    initialState
  );

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Season" htmlFor="seasonName" required hint='e.g. "2026-2027"'>
        <Input id="seasonName" name="seasonName" placeholder="2026-2027" required />
      </Field>
      <Field label="Team Name" htmlFor="name" required>
        <Input id="name" name="name" placeholder="Riverside Rangers" required />
      </Field>
      <Field label="League" htmlFor="league">
        <Input id="league" name="league" />
      </Field>
      <Field label="Division" htmlFor="division">
        <Input id="division" name="division" />
      </Field>
      <Field label="Head Coach" htmlFor="headCoach">
        <Input id="headCoach" name="headCoach" />
      </Field>
      <Field label="Assistant Coaches" htmlFor="assistantCoaches" hint="Comma-separated">
        <Input id="assistantCoaches" name="assistantCoaches" />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Season & Team"}
        </Button>
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
