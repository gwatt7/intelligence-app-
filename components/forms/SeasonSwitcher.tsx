"use client";

import { useState, useTransition } from "react";
import { switchSeason, createNewSeason, type ActionResult } from "@/lib/actions/team";
import { Select, Input } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";

export function SeasonSwitcher({
  seasons,
  currentSeasonId,
}: {
  seasons: { id: string; name: string }[];
  currentSeasonId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [addingNew, setAddingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(seasonId: string) {
    startTransition(async () => {
      await switchSeason(seasonId);
    });
  }

  async function handleCreate(formData: FormData) {
    const result: ActionResult = await createNewSeason(formData);
    if (result.ok) {
      setAddingNew(false);
      setError(null);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={currentSeasonId}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className="w-auto"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      {!addingNew ? (
        <Button variant="secondary" onClick={() => setAddingNew(true)}>
          + New Season
        </Button>
      ) : (
        <form
          action={(formData) => startTransition(() => handleCreate(formData))}
          className="flex items-center gap-2"
        >
          <Input id="seasonName" name="seasonName" placeholder="2027-2028" className="w-36" aria-label="New season name" />
          <Button type="submit" variant="secondary" disabled={pending}>
            Create
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAddingNew(false)}>
            Cancel
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
