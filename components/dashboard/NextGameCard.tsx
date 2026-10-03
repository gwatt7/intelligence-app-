import Image from "next/image";
import { Calendar } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { gameMatchupLabel, gameArenaLabel, gameCityStateLabel, gameTimeLabel } from "@/lib/game-display";
import { flatPanel, accentSurface, AccentGlowCorner } from "@/components/dashboard/dashboardCardStyles";
import { OpponentLogo } from "@/components/games/OpponentLogo";

interface GameLite {
  id: string;
  opponent: string;
  date: Date;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  timeTBA: boolean;
  arena: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  tournamentName: string | null;
}

/** Dashboard-only "Next Game" hero card — real schedule data in, the gold
 * accent border marking it as the featured card of the row, per the
 * reference. The opponent side shows that team's real logo when one has
 * been supplied (see lib/opponent-logos.ts via OpponentLogo), falling back
 * to a text monogram otherwise — never a guessed or generic logo. */
export function NextGameCard({ game, now }: { game: GameLite | null; now: Date }) {
  return (
    <div
      className={`${flatPanel} p-5 sm:p-6 lg:col-span-2 min-h-[250px] flex flex-col`}
      style={accentSurface("var(--accent-border)", "var(--accent-glow)")}
    >
      <AccentGlowCorner glow="var(--accent-glow)" fade="var(--accent-fade)" />
      {/* Decorative puck photo (user-supplied) filling the card's right side,
          fading into the card on the left rather than ending in a hard
          edge, per the reference. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 top-[42%] w-[52%] opacity-90"
        style={{
          maskImage: "linear-gradient(to left, black 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, black 50%, transparent 100%)",
        }}
      >
        <Image src="/dashboard/next-game-photo.png" alt="" fill className="object-cover object-bottom" />
      </div>

      <h3 className="relative text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">Next Game</h3>

      {game ? (
        <div className="relative mt-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
                <Image src="/uws-logo.png" alt="" width={36} height={36} className="object-contain" />
              </div>
              <span className="text-xs font-semibold text-foreground">UWS</span>
            </div>

            <span className="text-sm font-medium text-muted-2 shrink-0 uppercase">
              {game.homeAway === "AWAY" ? "@" : "vs"}
            </span>

            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <OpponentLogo opponent={game.opponent} className="h-14 w-14 sm:h-16 sm:w-16" />
              <span className="text-xs font-semibold text-foreground truncate max-w-[7rem] text-center">
                {game.opponent}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-foreground font-medium flex items-center gap-1.5 flex-wrap">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
                {format(game.date, "EEE, MMM d")} · {gameTimeLabel(game)}
                <Badge tone="accent" className="ml-1">
                  In {Math.max(differenceInCalendarDays(game.date, now), 0)}d
                </Badge>
              </p>
              {gameArenaLabel(game) && <p className="text-xs text-muted mt-0.5 truncate">{gameArenaLabel(game)}</p>}
              {gameCityStateLabel(game) && <p className="text-xs text-muted-2 truncate">{gameCityStateLabel(game)}</p>}
              {game.tournamentName && (
                <Badge tone="neutral" className="mt-1.5">
                  {game.tournamentName}
                </Badge>
              )}
            </div>
            <ButtonLink
              href={`/games/${game.id}`}
              variant="primary"
              className="!rounded-full !px-4 !py-1.5 text-xs shrink-0"
            >
              View →
            </ButtonLink>
          </div>
        </div>
      ) : (
        <p className="relative mt-4 text-sm text-muted">No upcoming game scheduled.</p>
      )}

      {/* sr-only fallback so the real matchup label is still present in the DOM for anything reading text content */}
      {game && <span className="sr-only">{gameMatchupLabel(game)}</span>}
    </div>
  );
}
