"use client";

import { useActionState, useState } from "react";
import { createGame, type ActionResult } from "@/lib/actions/games";
import { Field, Input, Select } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

const initialState: ActionResult = { ok: true };

export function NewGameForm({ seasonId }: { seasonId: string }) {
  const [timeTBA, setTimeTBA] = useState(false);
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
      <Field label="Opponent" htmlFor="opponent" required hint="Use &quot;TBA&quot; if not yet announced">
        <Input id="opponent" name="opponent" required />
      </Field>
      <Field label="Date" htmlFor="date" required>
        <Input id="date" name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
      </Field>
      <div className="flex items-end gap-3">
        <Field label="Time" htmlFor="time" className="flex-1">
          <Input id="time" name="time" type="time" defaultValue="19:00" disabled={timeTBA} />
        </Field>
        <label className="flex items-center gap-1.5 pb-2 text-sm text-muted">
          <input
            type="checkbox"
            name="timeTBA"
            checked={timeTBA}
            onChange={(e) => setTimeTBA(e.target.checked)}
            className="rounded border-border"
          />
          TBA
        </label>
      </div>
      <Field label="Home / Away / Neutral" htmlFor="homeAway" required>
        <Select id="homeAway" name="homeAway" defaultValue="HOME">
          <option value="HOME">Home</option>
          <option value="AWAY">Away</option>
          <option value="NEUTRAL">Neutral site</option>
        </Select>
      </Field>
      <Field label="Rink / Arena" htmlFor="arena">
        <Input id="arena" name="arena" />
      </Field>
      <Field label="City" htmlFor="city">
        <Input id="city" name="city" />
      </Field>
      <Field label="State" htmlFor="state">
        <Input id="state" name="state" />
      </Field>
      <Field label="Tournament / Event Name" htmlFor="tournamentName" hint="e.g. Superior Showdown, WIAC First Round">
        <Input id="tournamentName" name="tournamentName" />
      </Field>
      <Field label="Special Designation" htmlFor="specialEvent" hint="e.g. Senior Day, Youth Day">
        <Input id="specialEvent" name="specialEvent" />
      </Field>
      <Field label="Location Notes" htmlFor="location" hint="Free-text, shown alongside the structured fields above">
        <Input id="location" name="location" />
      </Field>
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
