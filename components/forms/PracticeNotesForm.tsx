"use client";

import { useActionState, useState } from "react";
import { updatePracticeNotes, type ActionResult } from "@/lib/actions/practices";
import { Field, Input, Textarea } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

export function PracticeNotesForm({
  practiceId,
  location,
  focus,
  notes,
}: {
  practiceId: string;
  location: string | null;
  focus: string | null;
  notes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    const result = await updatePracticeNotes(practiceId, formData);
    if (result.ok) setEditing(false);
    return result;
  }, initialState);

  if (!editing) {
    return (
      <div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">Location</dt>
            <dd className="mt-0.5">{location || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted uppercase tracking-wide">Practice Focus</dt>
            <dd className="mt-0.5">{focus || "—"}</dd>
          </div>
          <div className="sm:col-span-3">
            <dt className="text-xs text-muted uppercase tracking-wide">Coach Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{notes || "—"}</dd>
          </div>
        </dl>
        <Button variant="secondary" className="mt-4" onClick={() => setEditing(true)}>
          Edit Details
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label="Location" htmlFor="location">
        <Input id="location" name="location" defaultValue={location ?? ""} />
      </Field>
      <Field label="Practice Focus" htmlFor="focus" className="sm:col-span-2">
        <Input id="focus" name="focus" defaultValue={focus ?? ""} />
      </Field>
      <Field label="Coach Notes" htmlFor="notes" className="sm:col-span-3">
        <Textarea id="notes" name="notes" defaultValue={notes ?? ""} />
      </Field>
      <div className="sm:col-span-3 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
