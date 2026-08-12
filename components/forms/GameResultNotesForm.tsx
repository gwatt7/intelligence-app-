"use client";

import { useActionState, useState } from "react";
import { updateGameResultAndNotes, type ActionResult } from "@/lib/actions/games";
import { Field, Input, Textarea } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

export function GameResultNotesForm({
  gameId,
  location,
  ourScore,
  opponentScore,
  whatWentWell,
  whatWentWrong,
  coachNotes,
}: {
  gameId: string;
  location: string | null;
  ourScore: number | null;
  opponentScore: number | null;
  whatWentWell: string | null;
  whatWentWrong: string | null;
  coachNotes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    const result = await updateGameResultAndNotes(gameId, formData);
    if (result.ok) setEditing(false);
    return result;
  }, initialState);

  if (!editing) {
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">Score</dt>
            <dd className="mt-0.5">
              {ourScore !== null && opponentScore !== null ? `${ourScore} - ${opponentScore}` : "Not played yet"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted uppercase tracking-wide">Location</dt>
            <dd className="mt-0.5">{location || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">What went well?</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{whatWentWell || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">What went wrong?</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{whatWentWrong || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wide">Coach Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{coachNotes || "—"}</dd>
          </div>
        </dl>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit Result & Notes
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label="Our Score" htmlFor="ourScore">
        <Input id="ourScore" name="ourScore" type="number" min={0} defaultValue={ourScore ?? ""} />
      </Field>
      <Field label="Opponent Score" htmlFor="opponentScore">
        <Input id="opponentScore" name="opponentScore" type="number" min={0} defaultValue={opponentScore ?? ""} />
      </Field>
      <Field label="Location" htmlFor="location">
        <Input id="location" name="location" defaultValue={location ?? ""} />
      </Field>
      <Field label="What went well?" htmlFor="whatWentWell" className="sm:col-span-3">
        <Textarea id="whatWentWell" name="whatWentWell" defaultValue={whatWentWell ?? ""} />
      </Field>
      <Field label="What went wrong?" htmlFor="whatWentWrong" className="sm:col-span-3">
        <Textarea id="whatWentWrong" name="whatWentWrong" defaultValue={whatWentWrong ?? ""} />
      </Field>
      <Field label="Coach Notes" htmlFor="coachNotes" className="sm:col-span-3">
        <Textarea id="coachNotes" name="coachNotes" defaultValue={coachNotes ?? ""} />
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
