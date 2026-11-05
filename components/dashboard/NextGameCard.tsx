import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { gameArenaLabel, gameCityStateLabel, gameMatchupLabel, gameTimeLabel } from "@/lib/game-display";
import { getOpponentLogo } from "@/lib/opponent-logos";
import { initials } from "@/components/dashboard/dashboardCardStyles";
import { Countdown } from "@/components/dashboard/Countdown";
import { display, shortOpponent } from "@/components/dashboard/dashboardUi";
import type { ScheduleGame } from "@/components/dashboard/dashboardData";

const GAME_TYPE_LABEL = { PRESEASON: "Preseason", REGULAR_SEASON: "Regular season", PLAYOFFS: "Playoffs" } as const;
const SIDE_LABEL = { HOME: "Home", AWAY: "Away", NEUTRAL: "Neutral" } as const;

function TeamMark({ src, fallback }: { src: string | null; fallback: string }) {
  return (
    <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[3px] bg-white">
      {src ? (
        <Image src={src} alt="" width={60} height={60} className="h-[60px] w-[60px] object-contain" />
      ) : (
        <span className={`${display} text-[24px] font-bold text-[#0d1116]`}>{fallback}</span>
      )}
    </span>
  );
}

/** Featured "Next Game" card — real schedule data, live countdown, links to the game and its War Room. */
export function NextGameCard({
  game,
  isOpener,
  ourRecord,
  rematch,
  countdownTarget,
  renderedAt,
}: {
  game: ScheduleGame | null;
  isOpener: boolean;
  ourRecord: string;
  rematch: ScheduleGame | null;
  countdownTarget: string | null;
  renderedAt: string;
}) {
  if (!game) {
    return (
      <section className="overflow-hidden rounded-[4px] border-t-[5px] [--border:#f5b708] bg-[#0d1116] px-[22px] py-[18px] text-white">
        <p className={`${display} text-[15px] font-bold uppercase tracking-[0.16em] text-[#f5b708]`}>Next Game</p>
        <p className="mt-3 text-[14px] text-[#c9ccd1]">No upcoming game scheduled.</p>
      </section>
    );
  }

  const ourSide = SIDE_LABEL[game.homeAway];
  const theirSide = game.homeAway === "HOME" ? "Away" : game.homeAway === "AWAY" ? "Home" : "Neutral";
  const meta = [GAME_TYPE_LABEL[game.gameType], ourSide, game.tournamentName].filter(Boolean).join(" · ");
  const arena = gameArenaLabel(game);

  return (
    <section className="relative overflow-hidden rounded-[4px] border-t-[5px] [--border:#f5b708] bg-[#0d1116] text-white">
      {/* Navy panel with the gold slanted edge (decorative). */}
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-[180px] w-[392px] xl:block">
        <div className="absolute inset-0 bg-[#f5b708]" style={{ clipPath: "polygon(45px 0, 100% 0, 100% 100%, 0 100%)" }} />
        <div className="absolute inset-y-0 left-[10px] right-0 bg-[#13316b]" style={{ clipPath: "polygon(45px 0, 100% 0, 100% 100%, 0 100%)" }} />
      </div>

      <div className="relative flex h-[46px] items-center justify-between px-[22px]">
        <p className={`${display} text-[15px] font-bold uppercase tracking-[0.16em] text-[#f5b708]`}>
          Next Game{isOpener ? " · Season Opener" : ""}
        </p>
        <p className="text-[13px] text-[#dfe3ea]">{meta}</p>
      </div>
      <div aria-hidden className="relative mr-[392px] hidden h-px bg-[#1d2228] xl:block" />

      <div className="relative flex min-h-[133px] flex-col gap-6 px-[22px] py-[20px] xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-x-[28px] gap-y-4">
          <div className="flex items-center gap-[18px]">
            <TeamMark src="/dashboard/uws-logo-cutout.png" fallback="UWS" />
            <div>
              <p className={`${display} text-[27px] font-bold uppercase leading-none`}>Yellow Jackets</p>
              <p className="mt-[6px] text-[13px] text-[#9aa0a6]">
                {ourRecord} · {ourSide}
              </p>
            </div>
          </div>
          <span className={`${display} text-[17px] font-semibold uppercase text-[#6b7078]`}>{game.homeAway === "AWAY" ? "at" : "vs"}</span>
          <div className="flex items-center gap-[18px]">
            <TeamMark src={getOpponentLogo(game.opponent)} fallback={initials(game.opponent)} />
            <div>
              <p className={`${display} text-[27px] font-bold uppercase leading-none`}>{shortOpponent(game.opponent)}</p>
              <p className="mt-[6px] text-[13px] text-[#9aa0a6]">{theirSide}</p>
            </div>
          </div>
        </div>
        {countdownTarget && (
          <div className="xl:mr-[2px]">
            <Countdown target={countdownTarget} renderedAt={renderedAt} />
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-4 border-t [--border:#1f242b] bg-[#14181d] px-[22px] py-[14px] xl:h-[68px] xl:flex-row xl:items-center xl:justify-between xl:py-0">
        <div className="flex flex-wrap items-center gap-x-[26px] gap-y-2 text-[14px] text-[#e5e7eb]">
          <span className="flex items-center gap-[8px]">
            <Calendar className="h-[15px] w-[15px] text-[#9aa0a6]" strokeWidth={1.75} aria-hidden />
            {format(game.date, "EEE, MMM d")} · {gameTimeLabel(game)}
          </span>
          {arena && (
            <span className="flex items-center gap-[8px]" title={gameCityStateLabel(game) ?? undefined}>
              <MapPin className="h-[15px] w-[15px] text-[#9aa0a6]" strokeWidth={1.75} aria-hidden />
              {arena}
            </span>
          )}
          {rematch && (
            <span className="text-[#a3a8b0]">
              Rematch {format(rematch.date, "EEE M/d")} {rematch.homeAway === "AWAY" ? "at" : "vs"} {shortOpponent(rematch.opponent)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
          <Link
            href={`/war-room/${game.id}`}
            className="flex h-[40px] items-center whitespace-nowrap rounded-[3px] border [--border:#3b3f45] bg-[#0d1116] px-[15px] text-[13px] font-semibold text-white hover:[--border:#6b7078]"
          >
            Scouting report
          </Link>
          <Link
            href={`/games/${game.id}`}
            className="flex h-[40px] items-center gap-[8px] whitespace-nowrap rounded-[3px] bg-[#f5b800] px-[15px] text-[13px] font-semibold text-[#0d1116] hover:bg-[#ffc71a]"
          >
            Game preview <ArrowRight className="h-[14px] w-[14px]" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <span className="sr-only">{gameMatchupLabel(game)}</span>
    </section>
  );
}
