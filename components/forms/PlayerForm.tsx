"use client";

import { useActionState } from "react";
import { createPlayer, updatePlayer, type ActionResult } from "@/lib/actions/players";
import { Field, Input, Select } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

type PlayerDefaults = {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  shoots: "LEFT" | "RIGHT" | null;
  status: "ACTIVE" | "INJURED" | "UNAVAILABLE";
};

export function PlayerForm({
  seasonId,
  playerId,
  defaults,
  onDone,
}: {
  seasonId: string;
  playerId?: string;
  defaults?: PlayerDefaults;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    const result = playerId ? await updatePlayer(playerId, formData) : await createPlayer(seasonId, formData);
    if (result.ok) onDone?.();
    return result;
  }, initialState);

  return (
    <form action={formAction} className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
      <Field label="First Name" htmlFor="firstName" required>
        <Input id="firstName" name="firstName" defaultValue={defaults?.firstName} required />
      </Field>
      <Field label="Last Name" htmlFor="lastName" required>
        <Input id="lastName" name="lastName" defaultValue={defaults?.lastName} required />
      </Field>
      <Field label="Jersey #" htmlFor="jerseyNumber" required>
        <Input
          id="jerseyNumber"
          name="jerseyNumber"
          type="number"
          min={0}
          max={99}
          defaultValue={defaults?.jerseyNumber}
          required
        />
      </Field>
      <Field label="Position" htmlFor="position" required>
        <Select id="position" name="position" defaultValue={defaults?.position ?? "FORWARD"}>
          <option value="FORWARD">Forward</option>
          <option value="DEFENSE">Defense</option>
          <option value="GOALIE">Goalie</option>
        </Select>
      </Field>
      <Field label="Shoots" htmlFor="shoots" required>
        <Select id="shoots" name="shoots" defaultValue={defaults?.shoots ?? "LEFT"}>
          <option value="LEFT">Left</option>
          <option value="RIGHT">Right</option>
        </Select>
      </Field>
      <Field label="Status" htmlFor="status" required>
        <Select id="status" name="status" defaultValue={defaults?.status ?? "ACTIVE"}>
          <option value="ACTIVE">Active</option>
          <option value="INJURED">Injured</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </Select>
      </Field>
      <div className="col-span-2 sm:col-span-6 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : playerId ? "Save Player" : "Add Player"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        {!state.ok && <p className="text-sm text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
