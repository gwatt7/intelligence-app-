"use client";

import { Field, Select } from "@/components/forms/Field";
import type { $Enums } from "@/app/generated/prisma/client";

const CATEGORIES: { key: $Enums.HighlightCategory; label: string }[] = [
  { key: "PLAYER_OF_THE_GAME", label: "Player of the Game" },
  { key: "BEST_OFFENSIVE_PERFORMANCE", label: "Best Offensive Performance" },
  { key: "BEST_DEFENSIVE_PERFORMANCE", label: "Best Defensive Performance" },
  { key: "UNSUNG_HERO", label: "Unsung Hero" },
  { key: "GOALIE_PERFORMANCE", label: "Goalie Performance" },
];

export function HighlightsSelector({
  players,
  value,
  onChange,
}: {
  players: { id: string; name: string; jerseyNumber: number }[];
  value: Record<string, string>;
  onChange: (category: $Enums.HighlightCategory, playerId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {CATEGORIES.map((c) => (
        <Field key={c.key} label={c.label} htmlFor={`highlight-${c.key}`}>
          <Select id={`highlight-${c.key}`} value={value[c.key] ?? ""} onChange={(e) => onChange(c.key, e.target.value)}>
            <option value="">—</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber} {p.name}
              </option>
            ))}
          </Select>
        </Field>
      ))}
    </div>
  );
}
