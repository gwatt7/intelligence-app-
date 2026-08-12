"use client";

import { Field, Input, Select } from "@/components/forms/Field";
import { Button } from "@/components/ui/Button";
import { METRIC_LABEL } from "@/lib/objectives";
import type { ObjectiveDraft } from "@/lib/actions/war-room";

const METRICS = Object.keys(METRIC_LABEL) as (keyof typeof METRIC_LABEL)[];

export function ObjectivesEditor({
  objectives,
  onChange,
}: {
  objectives: ObjectiveDraft[];
  onChange: (next: ObjectiveDraft[]) => void;
}) {
  function update(i: number, patch: Partial<ObjectiveDraft>) {
    onChange(objectives.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  function remove(i: number) {
    onChange(objectives.filter((_, idx) => idx !== i));
  }

  function add() {
    onChange([...objectives, { text: "", metric: null, comparator: "LESS_THAN_OR_EQUAL", target: null }]);
  }

  return (
    <div className="space-y-3">
      {objectives.map((o, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded-lg border border-border p-3">
          <Field label={`Objective ${i + 1}`} htmlFor={`obj-text-${i}`} className="sm:col-span-5">
            <Input
              id={`obj-text-${i}`}
              value={o.text}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="e.g. Keep giveaways below 8"
            />
          </Field>
          <Field label="Linked Stat (optional)" htmlFor={`obj-metric-${i}`} className="sm:col-span-3">
            <Select
              id={`obj-metric-${i}`}
              value={o.metric ?? ""}
              onChange={(e) => update(i, { metric: (e.target.value || null) as ObjectiveDraft["metric"] })}
            >
              <option value="">No linked stat</option>
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {METRIC_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target" htmlFor={`obj-target-${i}`} className="sm:col-span-2">
            <Input
              id={`obj-target-${i}`}
              type="number"
              disabled={!o.metric}
              value={o.target ?? ""}
              onChange={(e) => update(i, { target: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Field>
          <Field label="Direction" htmlFor={`obj-comp-${i}`} className="sm:col-span-1">
            <Select
              id={`obj-comp-${i}`}
              disabled={!o.metric}
              value={o.comparator ?? "LESS_THAN_OR_EQUAL"}
              onChange={(e) => update(i, { comparator: e.target.value as ObjectiveDraft["comparator"] })}
            >
              <option value="LESS_THAN_OR_EQUAL">≤</option>
              <option value="GREATER_THAN_OR_EQUAL">≥</option>
            </Select>
          </Field>
          <div className="sm:col-span-1">
            <Button type="button" variant="ghost" className="text-negative" onClick={() => remove(i)}>
              ✕
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={add}>
        + Add Objective
      </Button>
    </div>
  );
}
