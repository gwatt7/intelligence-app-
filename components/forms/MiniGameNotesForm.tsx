"use client";

import { useActionState, useState, useTransition } from "react";
import { format } from "date-fns";
import { updateMiniGameNotes, deleteMiniGame, type ActionResult } from "@/lib/actions/mini-games";
import { Field, Textarea } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

export function MiniGameNotesForm({
  miniGameId,
  date,
  notes,
}: {
  miniGameId: string;
  date: Date;
  notes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    const result = await updateMiniGameNotes(miniGameId, formData);
    if (result.ok) setEditing(false);
    return result;
  }, initialState);

  function handleDelete() {
    if (
      !confirm(
        `Delete this Mini Game (${format(date, "MMM d, yyyy")})? This removes all Mini Game stats logged for it — official game stats and player profiles are unaffected. This can't be undone.`
      )
    ) {
      return;
    }
    startDeleteTransition(async () => {
      await deleteMiniGame(miniGameId);
    });
  }

  if (!editing) {
    return (
      <div>
        <dl className="text-sm">
          <dt className="text-xs text-muted uppercase tracking-wide">Notes</dt>
          <dd className="mt-0.5 whitespace-pre-wrap">{notes || "—"}</dd>
        </dl>
        <div className="flex items-center gap-3 mt-4">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit Notes
          </Button>
          <Button variant="ghost" className="text-negative" disabled={deletePending} onClick={handleDelete}>
            {deletePending ? "Deleting…" : "Delete Mini Game"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={notes ?? ""} />
      </Field>
      <div className="flex items-center gap-3 mt-4">
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
