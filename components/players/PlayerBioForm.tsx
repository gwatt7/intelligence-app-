"use client";

import { useActionState, useState } from "react";
import { updatePlayerBio, type ActionResult } from "@/lib/actions/players";
import { Field, Input, Select } from "@/components/forms/Field";
import { SPECIFIC_POSITIONS, type SpecificPosition } from "@/lib/positions";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

export interface PlayerBio {
  hometown: string | null;
  height: string | null;
  weight: number | null;
  classYear: string | null;
  primaryPosition: SpecificPosition | null;
  secondaryPosition: SpecificPosition | null;
  shoots: "LEFT" | "RIGHT" | null;
}

export function PlayerBioForm({ playerId, bio }: { playerId: string; bio: PlayerBio }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    const result = await updatePlayerBio(playerId, formData);
    if (result.ok) setEditing(false);
    return result;
  }, initialState);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-muted hover:text-accent-strong underline decoration-dotted underline-offset-2"
      >
        Edit Player Info
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-border bg-surface-raised p-3">
      <Field label="Hometown" htmlFor="hometown" className="col-span-2 sm:col-span-1">
        <Input id="hometown" name="hometown" defaultValue={bio.hometown ?? ""} placeholder="City, State" />
      </Field>
      <Field label="Height" htmlFor="height">
        <Input id="height" name="height" defaultValue={bio.height ?? ""} placeholder={'6\'1"'} />
      </Field>
      <Field label="Weight (lbs)" htmlFor="weight">
        <Input id="weight" name="weight" type="number" min={0} max={400} defaultValue={bio.weight ?? ""} />
      </Field>
      <Field label="Class / Year" htmlFor="classYear">
        <Input id="classYear" name="classYear" defaultValue={bio.classYear ?? ""} placeholder="Sophomore" />
      </Field>
      <Field label="Position" htmlFor="primaryPosition">
        <Select id="primaryPosition" name="primaryPosition" defaultValue={bio.primaryPosition ?? ""}>
          <option value="">Not set</option>
          {SPECIFIC_POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} ({p.value})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Can Also Play" htmlFor="secondaryPosition">
        <Select id="secondaryPosition" name="secondaryPosition" defaultValue={bio.secondaryPosition ?? ""}>
          <option value="">None</option>
          {SPECIFIC_POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} ({p.value})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Shoots" htmlFor="shoots">
        <Select id="shoots" name="shoots" defaultValue={bio.shoots ?? ""}>
          <option value="">Not set</option>
          <option value="LEFT">Left</option>
          <option value="RIGHT">Right</option>
        </Select>
      </Field>
      <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
        <Button type="submit" disabled={pending} className="!px-3 !py-1.5 text-xs">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        {state.ok === false && <p className="text-xs text-negative">{state.error}</p>}
      </div>
    </form>
  );
}
