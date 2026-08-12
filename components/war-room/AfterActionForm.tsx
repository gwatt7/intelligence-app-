"use client";

import { useState, useTransition } from "react";
import { saveAfterActionReport } from "@/lib/actions/war-room";
import { Field, Textarea } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import { ObjectiveReviewList, type ObjectiveForReview } from "@/components/war-room/ObjectiveReviewList";
import { HighlightsSelector } from "@/components/war-room/HighlightsSelector";
import type { RawStatLine } from "@/lib/stats";
import type { $Enums } from "@/app/generated/prisma/client";

export function AfterActionForm({
  gameId,
  teamTotals,
  objectives,
  players,
  defaults,
}: {
  gameId: string;
  teamTotals: RawStatLine;
  objectives: ObjectiveForReview[];
  players: { id: string; name: string; jerseyNumber: number }[];
  defaults: {
    whatWentWell: string;
    whatWentWrong: string;
    lessonsLearned: string;
    changesToMake: string;
    keepDoing: string;
    highlights: Record<string, string>;
  };
}) {
  const [whatWentWell, setWhatWentWell] = useState(defaults.whatWentWell);
  const [whatWentWrong, setWhatWentWrong] = useState(defaults.whatWentWrong);
  const [lessonsLearned, setLessonsLearned] = useState(defaults.lessonsLearned);
  const [changesToMake, setChangesToMake] = useState(defaults.changesToMake);
  const [keepDoing, setKeepDoing] = useState(defaults.keepDoing);
  const [highlights, setHighlights] = useState<Record<string, string>>(defaults.highlights);
  const [overrides, setOverrides] = useState<Record<string, $Enums.ObjectiveStatus | null>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveAfterActionReport(gameId, {
        whatWentWell,
        whatWentWrong,
        lessonsLearned,
        changesToMake,
        keepDoing,
        highlights: Object.entries(highlights).map(([category, playerId]) => ({
          category: category as $Enums.HighlightCategory,
          playerId: playerId || null,
        })),
        objectiveOverrides: Object.entries(overrides).map(([objectiveId, manualStatus]) => ({
          objectiveId,
          manualStatus,
        })),
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {objectives.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Objective Review</p>
          <ObjectiveReviewList
            objectives={objectives}
            teamTotals={teamTotals}
            overrides={overrides}
            onOverrideChange={(id, status) => setOverrides((prev) => ({ ...prev, [id]: status }))}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="What went well?" htmlFor="wentWell">
          <Textarea id="wentWell" value={whatWentWell} onChange={(e) => setWhatWentWell(e.target.value)} />
        </Field>
        <Field label="What went wrong?" htmlFor="wentWrong">
          <Textarea id="wentWrong" value={whatWentWrong} onChange={(e) => setWhatWentWrong(e.target.value)} />
        </Field>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Player Highlights</p>
        <HighlightsSelector
          players={players}
          value={highlights}
          onChange={(category, playerId) => setHighlights((prev) => ({ ...prev, [category]: playerId }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="What did we learn?" htmlFor="learned">
          <Textarea id="learned" value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} />
        </Field>
        <Field label="What should we change?" htmlFor="change">
          <Textarea id="change" value={changesToMake} onChange={(e) => setChangesToMake(e.target.value)} />
        </Field>
        <Field label="What should we repeat?" htmlFor="repeat">
          <Textarea id="repeat" value={keepDoing} onChange={(e) => setKeepDoing(e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? "Saving…" : "Save After Action Report"}
        </Button>
        {saved && <p className="text-sm text-positive">After Action Report saved.</p>}
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </div>
  );
}
