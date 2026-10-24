import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { getOpponentLogo } from "@/lib/opponent-logos";
import { gameTimeLabel } from "@/lib/game-display";
import { initials } from "@/components/dashboard/dashboardCardStyles";
import { display, shortOpponent } from "@/components/dashboard/dashboardUi";
import type { ScheduleGame } from "@/components/dashboard/dashboardData";

/** Top-of-dashboard strip with the next upcoming games (real schedule data). */
export function ScheduleStrip({ games }: { games: ScheduleGame[] }) {
  return (
    <div className="flex h-[70px] items-stretch overflow-x-auto border-b [--border:#e3e5e4] bg-white">
      <div className={`${display} flex w-[101px] shrink-0 items-center justify-center border-r [--border:#eef0f2] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#5b626b]`}>
        Schedule
      </div>

      {games.length === 0 && <p className="flex items-center px-6 text-[13px] text-[#5b626b]">No upcoming games scheduled.</p>}

      {games.map((g, i) => {
        const next = i === 0;
        const logo = getOpponentLogo(g.opponent);
        const when = `${format(g.date, "EEE M/d").toUpperCase()} · ${gameTimeLabel(g)}`;
        return (
          <Link
            key={g.id}
            href={`/games/${g.id}`}
            className={`relative flex shrink-0 items-center gap-[14px] border-r [--border:#eef0f2] pl-[21px] pr-[24px] transition-colors ${
              next ? "bg-[#fffbec]" : "hover:bg-[#fafafa]"
            }`}
          >
            <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center">
              {logo ? (
                <Image src={logo} alt="" width={32} height={32} className="max-h-[32px] w-auto object-contain" />
              ) : (
                <span className={`${display} text-[15px] font-bold text-[#0d1116]`}>{initials(g.opponent)}</span>
              )}
            </span>
            <span className="leading-none">
              <span
                className={`${display} block text-[11.5px] font-semibold uppercase tracking-[0.1em] ${
                  next ? "text-[#7a5a00]" : "text-[#5b626b]"
                }`}
              >
                {next ? `Next · ${when}` : when}
              </span>
              <span className={`${display} mt-[5px] block whitespace-nowrap text-[16px] font-bold text-[#0d1116]`}>
                {g.homeAway === "AWAY" ? "at" : "vs"} {shortOpponent(g.opponent)}
              </span>
            </span>
            {next && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-[#f0b70f]" />}
          </Link>
        );
      })}

      <Link
        href="/games"
        className="flex shrink-0 items-center whitespace-nowrap px-[20px] text-[13px] font-semibold text-[#181c1f] hover:text-[#8a6a00]"
      >
        Full schedule →
      </Link>
    </div>
  );
}
