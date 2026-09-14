// Shared display helpers for a Game's schedule info, so the Games list,
// Game detail page, and Dashboard cards all render it identically.

import { format } from "date-fns";

interface GameMatchup {
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  opponent: string;
}

export function gameHomeAwayLabel(homeAway: GameMatchup["homeAway"]): string {
  return homeAway === "HOME" ? "Home" : homeAway === "AWAY" ? "Away" : "Neutral";
}

/** e.g. "vs Bethel", "@ UW-Stout Polytechnic", "Neutral — WIAC First Round" */
export function gameMatchupLabel(g: GameMatchup & { tournamentName?: string | null }): string {
  if (g.homeAway === "NEUTRAL") {
    return g.opponent === "TBA" && g.tournamentName ? `Neutral — ${g.tournamentName}` : `Neutral vs ${g.opponent}`;
  }
  return `${g.homeAway === "HOME" ? "vs" : "@"} ${g.opponent}`;
}

interface GameLocation {
  arena: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
}

/** Arena name, e.g. "Siinto S. Wessman Arena". Falls back to the free-text location field if no structured arena is set. */
export function gameArenaLabel(g: GameLocation): string | null {
  return g.arena || g.location || null;
}

/** "City, State", or null if neither is known. */
export function gameCityStateLabel(g: Pick<GameLocation, "city" | "state">): string | null {
  const parts = [g.city, g.state].filter((v): v is string => !!v);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function gameTimeLabel(g: { date: Date; timeTBA: boolean }): string {
  return g.timeTBA ? "TBA" : format(g.date, "h:mm a");
}
