// Specific positions (set on the Player Profile) and their display labels.

export type SpecificPosition = "C" | "LW" | "RW" | "LD" | "RD" | "G";

export const SPECIFIC_POSITIONS: { value: SpecificPosition; label: string }[] = [
  { value: "C", label: "Center" },
  { value: "LW", label: "Left Wing" },
  { value: "RW", label: "Right Wing" },
  { value: "LD", label: "Left Defense" },
  { value: "RD", label: "Right Defense" },
  { value: "G", label: "Goalie" },
];

export const SPECIFIC_POSITION_LABEL: Record<SpecificPosition, string> = Object.fromEntries(
  SPECIFIC_POSITIONS.map((p) => [p.value, p.label])
) as Record<SpecificPosition, string>;
