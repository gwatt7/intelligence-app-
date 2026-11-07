import { Card, CardTitle } from "@/components/ui/Card";
import { RawStatLine, UntrackedAwareLine, getStatValue, getTrackedStatValue, trackedGameCountFor, formatPct } from "@/lib/stats";

interface StatDef {
  key: string;
  label: string;
  derived?: boolean;
  isPct?: boolean;
}

export function StatCategoryCard({
  title,
  items,
  stat,
  entries,
}: {
  title: string;
  items: readonly StatDef[];
  stat: RawStatLine;
  /** Official Games only: this season's per-game lines, for "Did Not Track" aware display — a field never tracked all season shows NT instead of 0, and one tracked in only some games gets a "(X/Y games)" footnote. Omit for Mini Games, which have no Did Not Track concept. */
  entries?: readonly UntrackedAwareLine[];
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item) => {
          const value = entries ? getTrackedStatValue(entries, item.key) : getStatValue(stat, item.key);
          const { tracked, total } = entries ? trackedGameCountFor(entries, item.key) : { tracked: 0, total: 0 };
          // Distinct from value === null: a percentage can legitimately be
          // null from a real 0-of-0 (no attempts made, still fully tracked)
          // — that renders as "—" via formatPct, same as before this
          // feature. Only "every game flagged Did Not Track" renders "NT".
          const neverTracked = !!entries && total > 0 && tracked === 0;
          const partiallyTracked = !!entries && tracked > 0 && tracked < total;
          return (
            <div key={item.key}>
              <dt className="text-xs text-muted">{item.label}</dt>
              <dd className="text-lg font-semibold text-foreground mt-0.5">
                {neverTracked ? "NT" : item.isPct ? formatPct(value) : (value ?? 0)}
              </dd>
              {partiallyTracked && <dd className="text-[11px] text-muted-2">tracked in {tracked}/{total} games</dd>}
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
