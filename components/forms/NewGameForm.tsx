"use client";

import { useActionState } from "react";
import { createGame, type ActionResult } from "@/lib/actions/games";
import { Field, Input, Select } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

const initialState: ActionResult = { ok: true };

export function NewGameForm({ seasonId }: { seasonId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createGame(seasonId, formData),
    initialState
  );

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Game Type" htmlFor="gameType" required>
        <Select id="gameType" name="gameType" defaultValue="REGULAR_SEASON">
          <option value="PRESEASON">Preseason</option>
          <option value="REGULAR_SEASON">Regular Season</option>
          <option value="PLAYOFFS">Playoffs</option>
        </Select>
      </Field>
      <Field label="Opponent" htmlFor="opponent" required>
        <Input id="opponent" name="opponent" required />
      </Field>
      <Field label="Date" htmlFor="date" required>
        <Input id="date" name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
      </Field>
      <Field label="Home / Away" htmlFor="homeAway" required>
        <Select id="homeAway" name="homeAway" defaultValue="HOME">
          <option value="HOME">Home</option>
          <option value="AWAY">Away</option>
        </Select>
      </Field>
      <Field label="Location" htmlFor="location">
        <Input id="location" name="location" />
      </Field>
      <div />
      <Field label="Our Score" htmlFor="ourScore" hint="Leave blank until the game is played">
        <Input id="ourScore" name="ourScore" type="number" min={0} />
      </Field>
      <Field label="Opponent Score" htmlFor="opponentScore" hint="Leave blank until the game is played">
        <Input id="opponentScore" name="opponentScore" type="number" min={0} />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Game"}
        </Button>
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
