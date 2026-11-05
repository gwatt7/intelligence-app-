"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { VIEW_LABEL, VIEW_PARAMS as VIEWS, type SituationView } from "@/lib/game-situations";

/** Situation filter + game picker for the Analytics game statistics. Both live in the URL. */
export function GameStatsFilters({
  view,
  gameId,
  games,
}: {
  view: SituationView;
  gameId: string | null;
  games: { id: string; label: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const go = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    router.push(`/analytics?${q.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="tablist" aria-label="Game situation" className="inline-flex flex-wrap rounded-lg border border-border bg-surface p-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => go({ situation: v.key === "ALL" ? null : v.param })}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === v.key ? "bg-accent text-accent-contrast" : "text-muted hover:bg-surface-raised hover:text-foreground"
            )}
          >
            {VIEW_LABEL[v.key]}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        Games
        <select
          value={gameId ?? ""}
          onChange={(e) => go({ game: e.target.value || null })}
          className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">Whole season</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
