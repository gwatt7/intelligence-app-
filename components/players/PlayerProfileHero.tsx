import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PlayerPhotoUpload } from "@/components/players/PlayerPhotoUpload";
import { PlayerBioForm, type PlayerBio } from "@/components/players/PlayerBioForm";
import { lightCardStyle } from "@/components/players/lightCardStyle";

const POSITION_LABEL = { FORWARD: "Forward", DEFENSE: "Defense", GOALIE: "Goalie" } as const;

interface HeroPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  shoots: "LEFT" | "RIGHT" | null;
  status: "ACTIVE" | "INJURED" | "UNAVAILABLE";
  photoUrl: string | null;
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

  return (
    <div className="rounded-xl border border-border bg-surface p-5 sm:p-6" style={lightCardStyle}>
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
        <PlayerPhotoUpload playerId={player.id} photoUrl={player.photoUrl} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={player.status} />
            {player.shoots && (
              <span className="text-xs text-muted-2">Shoots {player.shoots === "LEFT" ? "Left" : "Right"}</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight break-words">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-sm text-muted mt-1.5">{buildInfoLine(player)}</p>

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
