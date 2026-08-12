"use client";

import { Select } from "@/components/forms/Field";
import { Badge } from "@/components/ui/Badge";
import { METRIC_LABEL, actualValueForMetric, evaluateObjective } from "@/lib/objectives";
import { formatPct } from "@/lib/stats";
import type { RawStatLine } from "@/lib/stats";
import type { $Enums } from "@/app/generated/prisma/client";

export interface ObjectiveForReview {
  id: string;
  text: string;
  metric: $Enums.ObjectiveMetric | null;
  comparator: $Enums.ObjectiveComparator | null;
  target: number | null;
  manualStatus: $Enums.ObjectiveStatus | null;
}

const STATUS_TONE: Record<$Enums.ObjectiveStatus, "positive" | "warning" | "negative"> = {
  ACHIEVED: "positive",
  PARTIALLY_ACHIEVED: "warning",
  NOT_ACHIEVED: "negative",
};
const STATUS_LABEL: Record<$Enums.ObjectiveStatus, string> = {
  ACHIEVED: "Achieved",
  PARTIALLY_ACHIEVED: "Partially Achieved",
  NOT_ACHIEVED: "Not Achieved",
};

export function ObjectiveReviewList({
  objectives,
  teamTotals,
  overrides,
  onOverrideChange,
}: {
  objectives: ObjectiveForReview[];
  teamTotals: RawStatLine;
  overrides: Record<string, $Enums.ObjectiveStatus | null>;
  onOverrideChange: (objectiveId: string, status: $Enums.ObjectiveStatus | null) => void;
}) {
  return (
    <div className="space-y-3">
      {objectives.map((o) => {
        const actual = o.metric ? actualValueForMetric(o.metric, teamTotals) : null;
        const autoStatus =
          o.metric && o.comparator && o.target !== null && actual !== null
            ? evaluateObjective(o.comparator, o.target, actual)
            : null;
        const effective = overrides[o.id] !== undefined ? overrides[o.id] : o.manualStatus ?? autoStatus;
        const isPct = o.metric === "ZONE_ENTRY_PCT" || o.metric === "ZONE_EXIT_PCT";

        return (
          <div key={o.id} className="rounded-lg border border-border p-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-foreground">{o.text}</p>
              {o.metric && (
                <p className="text-xs text-muted mt-0.5">
                  {METRIC_LABEL[o.metric]} target {o.comparator === "LESS_THAN_OR_EQUAL" ? "≤" : "≥"} {o.target}
                  {actual !== null && ` · Actual: ${isPct ? formatPct(actual) : actual}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {effective && <Badge tone={STATUS_TONE[effective]}>{STATUS_LABEL[effective]}</Badge>}
              <Select
                value={overrides[o.id] ?? ""}
                onChange={(e) => onOverrideChange(o.id, (e.target.value || null) as $Enums.ObjectiveStatus | null)}
                className="w-auto text-xs"
              >
                <option value="">{autoStatus ? "Use auto result" : "Set status…"}</option>
                <option value="ACHIEVED">Achieved</option>
                <option value="PARTIALLY_ACHIEVED">Partially Achieved</option>
                <option value="NOT_ACHIEVED">Not Achieved</option>
              </Select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
