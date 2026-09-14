import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatMiniGameChange, type StatProgression } from "@/lib/mini-game-analytics";
import type { RawStatLine } from "@/lib/stats";

interface Item {
  key: keyof RawStatLine;
  label: string;
}

export function MiniGameProgressionCard({
  title,
  items,
  progression,
}: {
  title: string;
  items: readonly Item[];
  progression: Record<keyof RawStatLine, StatProgression> | null;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {!progression ? (
        <p className="text-sm text-muted">Need at least 2 Mini Games logged to show progression.</p>
      ) : (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((item) => {
            const p = progression[item.key];
            return (
              <div key={item.key}>
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd
                  className={cn(
                    "text-sm font-semibold mt-0.5",
                    p.type === "increase" && "text-positive",
                    p.type === "decrease" && "text-negative",
                    p.type === "new" && "text-accent-strong"
                  )}
                >
                  {formatMiniGameChange(p)}
                </dd>
                <dd className="text-xs text-muted-2">
                  {p.previous} → {p.current}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </Card>
  );
}
