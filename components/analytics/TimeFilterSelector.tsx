"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { TIME_FILTERS, TIME_FILTER_LABEL, type TimeFilter } from "@/lib/team-analytics";

export function TimeFilterSelector({ current }: { current: TimeFilter }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(filter: TimeFilter) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", filter);
    router.push(`/analytics?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {TIME_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => select(f)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            f === current ? "bg-accent/15 text-accent-strong" : "text-muted hover:text-foreground hover:bg-surface-raised border border-border"
          )}
        >
          {TIME_FILTER_LABEL[f]}
        </button>
      ))}
    </div>
  );
}
