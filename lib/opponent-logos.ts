// Centralized opponent-logo mapping — the single place that knows which
// real logo file (public/logos/opponents/) belongs to which opponent, so
// Next Game, Last Game, and the Games schedule all resolve it the same way
// instead of each guessing independently.
//
// Keyed by the exact `Game.opponent` string from the schedule, matched
// case-insensitively after trimming. An opponent not listed here (not yet
// supplied, or a TBA/tournament placeholder like "Superior Showdown") has
// no entry — callers fall back to the existing text-monogram treatment,
// never a fabricated or generic logo.
const OPPONENT_LOGOS: Record<string, string> = {
  beloit: "/logos/opponents/beloit.png",
  bethel: "/logos/opponents/bethel.png",
  hamline: "/logos/opponents/hamline.png",
  "saint john's (minn.)": "/logos/opponents/saint-johns.jpg",
  "st. scholastica": "/logos/opponents/st-scholastica.png",
  "uw-eau claire": "/logos/opponents/eau-claire.jpg",
  "uw-river falls": "/logos/opponents/river-falls.jpg",
  "uw-stevens point": "/logos/opponents/stevens-point.png",
  "uw-stout polytechnic": "/logos/opponents/uw-stout.jpg",
};

export function getOpponentLogo(opponent: string): string | null {
  return OPPONENT_LOGOS[opponent.trim().toLowerCase()] ?? null;
}
