import Image from "next/image";
import type { CSSProperties } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PlayerPhotoUpload } from "@/components/players/PlayerPhotoUpload";
import { PlayerBackgroundPhotoUpload } from "@/components/players/PlayerBackgroundPhotoUpload";
import { PlayerBioForm, type PlayerBio } from "@/components/players/PlayerBioForm";
import { lightCardStyle } from "@/components/players/lightCardStyle";

const POSITION_LABEL = { FORWARD: "Forward", DEFENSE: "Defense", GOALIE: "Goalie" } as const;

// Below this average brightness (0 darkest - 1 lightest), the background
// photo reads as "dark overall" and the name/hometown/position/etc. switch
// to light grey on a dark scrim instead of the default dark-on-light —
// see heroImageBrightness on the Player model for how this is computed.
const DARK_PHOTO_THRESHOLD = 0.5;

// Light grey/near-white text for the dark-photo scheme — every themed text
// element on this card (h1, muted labels, the ghost-variant text buttons)
// reads off --foreground/--muted/--muted-2, so overriding just these three
// custom properties re-colors all of it at once without touching those
// components individually.
const LIGHT_TEXT_ON_DARK_STYLE: CSSProperties = {
  ["--foreground" as string]: "#f5f5f0",
  ["--muted" as string]: "#d6d6cd",
  ["--muted-2" as string]: "#b3b3a8",
};

interface HeroPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  shoots: "LEFT" | "RIGHT" | null;
  status: "ACTIVE" | "INJURED" | "UNAVAILABLE";
  photoUrl: string | null;
  heroImageUrl: string | null;
  heroImageFocalX: number | null;
  heroImageFocalY: number | null;
  heroImageBrightness: number | null;
  hometown: string | null;
  height: string | null;
  weight: number | null;
  classYear: string | null;
}

/** "Hometown · Position · #XX · Height · Weight · Class" — only the parts that are actually filled in, so it stays small and clean rather than showing placeholder dashes. Position and jersey # are always shown since every player has them. */
function buildInfoLine(player: HeroPlayer): string {
  const parts: string[] = [];
  if (player.hometown) parts.push(player.hometown);
  parts.push(POSITION_LABEL[player.position]);
  parts.push(`#${player.jerseyNumber}`);
  if (player.height) parts.push(player.height);
  if (player.weight) parts.push(`${player.weight} lbs`);
  if (player.classYear) parts.push(player.classYear);
  return parts.join(" · ");
}

export function PlayerProfileHero({ player }: { player: HeroPlayer }) {
  const bio: PlayerBio = {
    hometown: player.hometown,
    height: player.height,
    weight: player.weight,
    classYear: player.classYear,
  };

  // Only a real, computed reading flips the scheme — a photo saved before
  // heroImageBrightness existed (brightness still null) keeps the original
  // light-scrim/dark-text look exactly as before, no regression.
  const isDarkPhoto =
    player.heroImageUrl !== null &&
    player.heroImageBrightness !== null &&
    player.heroImageBrightness < DARK_PHOTO_THRESHOLD;

  // A very subtle shadow, only when a photo is actually behind the text —
  // extra insurance at the scrim's thin/far edge (e.g. the stacked mobile
  // layout, where this row can extend under a less-covered part of the
  // photo) on top of the scrim itself, not a replacement for it.
  const heroTextShadow = !player.heroImageUrl ? undefined : isDarkPhoto ? "0 1px 3px rgba(0,0,0,0.6)" : "0 1px 2px rgba(255,255,255,0.6)";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-surface p-5 sm:p-6 ${
        player.heroImageUrl ? "min-h-[260px] sm:min-h-[280px]" : ""
      }`}
      style={isDarkPhoto ? { ...lightCardStyle, ...LIGHT_TEXT_ON_DARK_STYLE } : lightCardStyle}
    >
      {player.heroImageUrl && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={player.heroImageUrl}
            alt=""
            fill
            className="object-cover"
            style={{
              objectPosition:
                player.heroImageFocalX !== null && player.heroImageFocalY !== null
                  ? `${player.heroImageFocalX}% ${player.heroImageFocalY}%`
                  : "70% 30%",
            }}
          />
          {/* Scrim so the name/badges/buttons stay readable while the photo
              remains clearly visible on the right — light-toned (matching
              this card's own light palette) for an overall-light photo,
              dark-toned (paired with the light text above) for an
              overall-dark one. Automatic, from heroImageBrightness. */}
          <div
            className="absolute inset-0"
            style={{
              background: isDarkPhoto
                ? "linear-gradient(90deg, rgba(17,17,15,0.95) 0%, rgba(17,17,15,0.88) 30%, rgba(17,17,15,0.55) 55%, rgba(17,17,15,0.15) 80%)"
                : "linear-gradient(90deg, var(--profile-card-bg) 0%, rgba(233,233,228,0.92) 30%, rgba(233,233,228,0.55) 55%, rgba(233,233,228,0.15) 80%)",
            }}
          />
        </div>
      )}

      <div className="relative flex flex-col sm:flex-row gap-5 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <PlayerPhotoUpload playerId={player.id} photoUrl={player.photoUrl} />
          <PlayerBackgroundPhotoUpload
            playerId={player.id}
            heroImageUrl={player.heroImageUrl}
            heroImageFocalX={player.heroImageFocalX}
            heroImageFocalY={player.heroImageFocalY}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={player.status} />
            {player.shoots && (
              <span className="text-xs text-muted-2" style={{ textShadow: heroTextShadow }}>
                Shoots {player.shoots === "LEFT" ? "Left" : "Right"}
              </span>
            )}
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-foreground leading-tight break-words"
            style={{ textShadow: heroTextShadow }}
          >
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-sm text-muted mt-1.5" style={{ textShadow: heroTextShadow }}>
            {buildInfoLine(player)}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <ButtonLink href="/team" variant="ghost" className="!px-3 !py-1.5 text-xs">
              Edit in Roster
            </ButtonLink>
            <PlayerBioForm playerId={player.id} bio={bio} />
          </div>
        </div>
      </div>
    </div>
  );
}
