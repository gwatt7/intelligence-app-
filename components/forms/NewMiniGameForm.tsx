"use client";

import { useActionState } from "react";
import { createMiniGame, type ActionResult } from "@/lib/actions/mini-games";
import { Field, Input, Textarea } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

const initialState: ActionResult = { ok: true };

export function NewMiniGameForm({ seasonId }: { seasonId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createMiniGame(seasonId, formData),
    initialState
  );

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Date" htmlFor="date" required>
        <Input id="date" name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
      </Field>
      <div />
      <Field label="Notes" htmlFor="notes" className="sm:col-span-2" hint="Optional — e.g. format, focus for this Mini Game">
        <Textarea id="notes" name="notes" />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Mini Game"}
        </Button>
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
