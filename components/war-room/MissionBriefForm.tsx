"use client";

import { useState, useTransition } from "react";
import { saveMissionBrief, type ObjectiveDraft } from "@/lib/actions/war-room";
import { Field, Textarea } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import { ObjectivesEditor } from "@/components/war-room/ObjectivesEditor";

export function MissionBriefForm({
  gameId,
  defaults,
}: {
  gameId: string;
  defaults: {
    opponentStrengths: string;
    opponentWeaknesses: string;
    opponentHabits: string;
    keysToVictory: string;
    objectives: ObjectiveDraft[];
  };
}) {
  const [opponentStrengths, setOpponentStrengths] = useState(defaults.opponentStrengths);
  const [opponentWeaknesses, setOpponentWeaknesses] = useState(defaults.opponentWeaknesses);
  const [opponentHabits, setOpponentHabits] = useState(defaults.opponentHabits);
  const [keysToVictory, setKeysToVictory] = useState(defaults.keysToVictory);
  const [objectives, setObjectives] = useState<ObjectiveDraft[]>(
    defaults.objectives.length > 0 ? defaults.objectives : [{ text: "", metric: null, comparator: "LESS_THAN_OR_EQUAL", target: null }]
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveMissionBrief(gameId, {
        opponentStrengths,
        opponentWeaknesses,
        opponentHabits,
        keysToVictory,
        objectives,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Opponent Strengths" htmlFor="oppStrengths" hint="One per line">
          <Textarea id="oppStrengths" value={opponentStrengths} onChange={(e) => setOpponentStrengths(e.target.value)} />
        </Field>
        <Field label="Opponent Weaknesses" htmlFor="oppWeaknesses" hint="One per line">
          <Textarea id="oppWeaknesses" value={opponentWeaknesses} onChange={(e) => setOpponentWeaknesses(e.target.value)} />
        </Field>
        <Field label="Opponent Habits" htmlFor="oppHabits" hint="One per line">
          <Textarea id="oppHabits" value={opponentHabits} onChange={(e) => setOpponentHabits(e.target.value)} />
        </Field>
      </div>

      <Field label="Keys to Victory" htmlFor="keys" hint="Up to five, one per line">
        <Textarea id="keys" value={keysToVictory} onChange={(e) => setKeysToVictory(e.target.value)} />
      </Field>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Game Objectives</p>
        <ObjectivesEditor objectives={objectives} onChange={setObjectives} />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? "Saving…" : "Save Mission Brief"}
        </Button>
        {saved && <p className="text-sm text-positive">Mission Brief saved.</p>}
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </div>
  );
}
