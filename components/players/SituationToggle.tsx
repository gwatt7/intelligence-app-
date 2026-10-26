"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/players/situationToggle.module.css";
import { PROFILE_VIEW_LABEL, SITUATION_PARAM as PARAM, type ProfileView } from "@/lib/situation-stats";

const ORDER: ProfileView[] = ["ALL", "POWER_PLAY", "PENALTY_KILL"];

/**
 * Overall / Power Play / Penalty Kill switch for the player profile.
 * All three views stay mounted (only the selected one is visible), so
 * switching is instant and never discards anything typed into a form in
 * another view. The choice is mirrored in the URL (?situation=pp) without
 * a reload, so a refresh keeps the same view.
 */
export function SituationToggle({
  initial,
  views,
}: {
  initial: ProfileView;
  views: Record<ProfileView, ReactNode>;
}) {
  const [selected, setSelected] = useState<ProfileView>(initial);

  const select = (s: ProfileView) => {
    setSelected(s);
    const url = new URL(window.location.href);
    if (s === "ALL") url.searchParams.delete("situation");
    else url.searchParams.set("situation", PARAM[s]);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <div className={cn(styles.root, "space-y-4")}>
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Game situation" className="inline-flex w-full rounded-lg border border-border bg-surface p-1 sm:w-auto">
          {ORDER.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              id={`situation-tab-${s}`}
              aria-selected={selected === s}
              aria-controls={`situation-panel-${s}`}
              onClick={() => select(s)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
                selected === s ? "bg-accent text-accent-contrast" : "text-muted hover:bg-surface-raised hover:text-foreground"
              )}
            >
              {PROFILE_VIEW_LABEL[s]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-2">Official game stats. Overall combines 5-on-5, Power Play and Penalty Kill; each is recorded separately.</p>
      </div>

      {ORDER.map((s) => (
        <div key={s} role="tabpanel" id={`situation-panel-${s}`} aria-labelledby={`situation-tab-${s}`} hidden={selected !== s}>
          {views[s]}
        </div>
      ))}
    </div>
  );
}
