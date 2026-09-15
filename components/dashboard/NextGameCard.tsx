import Image from "next/image";
import { format, differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { gameMatchupLabel, gameArenaLabel, gameCityStateLabel, gameTimeLabel } from "@/lib/game-display";
import { glassPanel, initials } from "@/components/dashboard/dashboardCardStyles";

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

/** Dashboard-only "Next Game" hero card — real schedule data in, with the user-supplied hockey-arena photo as a full-card background. The opponent side still uses a text-derived monogram: the only verified real team crest in this project is UWS's own (public/uws-logo.png) — there's no confirmed-authentic opponent trademark file to use, so nothing is guessed. */
export function NextGameCard({ game, now }: { game: GameLite | null; now: Date }) {
  return (
    <div className={`${glassPanel} p-5 sm:p-6 lg:col-span-2 min-h-[250px] flex flex-col`}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #fcd306, transparent 70%)" }}
      />
      {/* Full-card hockey-arena photo background (user-supplied), with a
          left-to-right dark gradient so the real matchup content stays
          readable while the image remains the dominant visual. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image src="/dashboard/games-card-bg.png" alt="" fill className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.22) 75%, rgba(10,10,10,0.1) 100%)",
          }}
        />
      </div>
      <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">Next Game</p>

      {game ? (
        <div className="relative mt-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
                <Image src="/uws-logo.png" alt="" width={36} height={36} className="object-contain" />
              </div>
              <span className="text-xs font-semibold text-foreground">UWS</span>
            </div>

            <span className="text-sm font-medium text-muted-2 shrink-0">
              {game.homeAway === "AWAY" ? "@" : "vs"}
            </span>

            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0 text-base font-bold text-muted">
                {initials(game.opponent)}
              </div>
              <span className="text-xs font-semibold text-foreground truncate max-w-[7rem] text-center">
                {game.opponent}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-foreground font-medium flex items-center gap-1.5">
                <span aria-hidden>📅</span>
                {format(game.date, "EEE, MMM d")} · {gameTimeLabel(game)}
              </p>
              {gameArenaLabel(game) && <p className="text-xs text-muted mt-0.5 truncate">{gameArenaLabel(game)}</p>}
              {gameCityStateLabel(game) && <p className="text-xs text-muted-2 truncate">{gameCityStateLabel(game)}</p>}
              {game.tournamentName && (
                <Badge tone="neutral" className="mt-1.5">
                  {game.tournamentName}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge tone="accent">In {Math.max(differenceInCalendarDays(game.date, now), 0)}d</Badge>
              <ButtonLink href={`/games/${game.id}`} variant="primary" className="!px-3 !py-1.5 text-xs">
                View →
              </ButtonLink>
            </div>
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
