import { Card, CardTitle } from "@/components/ui/Card";
import { RawStatLine, getStatValue, formatPct } from "@/lib/stats";

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
}: {
  title: string;
  items: readonly StatDef[];
  stat: RawStatLine;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item) => {
          const value = getStatValue(stat, item.key);
          return (
            <div key={item.key}>
              <dt className="text-xs text-muted">{item.label}</dt>
              <dd className="text-lg font-semibold text-foreground mt-0.5">
                {item.isPct ? formatPct(value) : value ?? 0}
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
