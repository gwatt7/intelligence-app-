"use client";

import { useActionState, useState } from "react";
import { updateTeamInfo, type ActionResult } from "@/lib/actions/team";
import { Field, Input } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

const initialState: ActionResult = { ok: true };

export function TeamInfoForm({
  seasonId,
  team,
}: {
  seasonId: string;
  team: {
    name: string;
    league: string | null;
    division: string | null;
    headCoach: string | null;
    assistantCoaches: string | null;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await updateTeamInfo(seasonId, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    initialState
  );

  if (!editing) {
    return (
      <div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <Item label="Team Name" value={team.name} />
          <Item label="League" value={team.league} />
          <Item label="Division" value={team.division} />
          <Item label="Head Coach" value={team.headCoach} />
          <Item label="Assistant Coaches" value={team.assistantCoaches} />
        </dl>
        <Button variant="secondary" className="mt-4" onClick={() => setEditing(true)}>
          Edit Team Info
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Team Name" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={team.name} required />
      </Field>
      <Field label="League" htmlFor="league">
        <Input id="league" name="league" defaultValue={team.league ?? ""} />
      </Field>
      <Field label="Division" htmlFor="division">
        <Input id="division" name="division" defaultValue={team.division ?? ""} />
      </Field>
      <Field label="Head Coach" htmlFor="headCoach">
        <Input id="headCoach" name="headCoach" defaultValue={team.headCoach ?? ""} />
      </Field>
      <Field label="Assistant Coaches" htmlFor="assistantCoaches" hint="Comma-separated">
        <Input id="assistantCoaches" name="assistantCoaches" defaultValue={team.assistantCoaches ?? ""} />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
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

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-muted text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-foreground mt-0.5">{value || "—"}</dd>
    </div>
  );
}
