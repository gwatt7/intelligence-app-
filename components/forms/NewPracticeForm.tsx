"use client";

import { useActionState } from "react";
import { createPractice, type ActionResult } from "@/lib/actions/practices";
import { Field, Input, Textarea } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

const initialState: ActionResult = { ok: true };

export function NewPracticeForm({
  seasonId,
  suggestedNumber,
  suggestedWeek,
}: {
  seasonId: string;
  suggestedNumber: number;
  suggestedWeek: number;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createPractice(seasonId, formData),
    initialState
  );

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Week" htmlFor="week" required>
        <Input id="week" name="week" type="number" min={1} defaultValue={suggestedWeek} required />
      </Field>
      <Field label="Practice #" htmlFor="number" required>
        <Input id="number" name="number" type="number" min={1} defaultValue={suggestedNumber} required />
      </Field>
      <Field label="Date" htmlFor="date" required>
        <Input id="date" name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
      </Field>
      <Field label="Location" htmlFor="location">
        <Input id="location" name="location" />
      </Field>
      <Field label="Practice Focus" htmlFor="focus" className="sm:col-span-2">
        <Input id="focus" name="focus" placeholder="e.g. Zone entries, breakouts" />
      </Field>
      <Field label="Coach Notes" htmlFor="notes" className="sm:col-span-2">
        <Textarea id="notes" name="notes" />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Practice"}
        </Button>
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
