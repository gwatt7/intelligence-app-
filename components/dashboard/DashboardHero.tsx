import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { display } from "@/components/dashboard/dashboardUi";

/**
 * Dashboard header banner: team identity, the two header actions, and the
 * season summary row (record, games left, roster size, streak). Every value
 * is passed in from real data by the dashboard page.
 */
export function DashboardHero({
  teamName,
  subtitle,
  record,
  gamesLeft,
  rosterCount,
  streak,
}: {
  teamName: string;
  subtitle: string;
  record: string;
  gamesLeft: number;
  rosterCount: number;
  streak: string | null;
}) {
  const stats = [
    { label: "Record", value: record, gold: true },
    { label: "Games Left", value: String(gamesLeft) },
    { label: "Roster", value: String(rosterCount) },
    { label: "Streak", value: streak ?? "–" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[4px] bg-[#0d1116] text-white" title={teamName}>
      {/* Rink photo (existing asset), black & white, darkened toward the left. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/dashboard/dashboard-bg-arena.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 1120px, 100vw"
          className="object-cover grayscale"
          style={{ objectPosition: "50% 38%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(13,17,22,0.94) 0%, rgba(13,17,22,0.86) 30%, rgba(13,17,22,0.72) 60%, rgba(13,17,22,0.6) 100%)",
          }}
        />
      </div>

      <div className="relative flex flex-col gap-5 px-[30px] pt-[38px] xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-[20px] pt-[2px]">
          <span className="flex h-[85px] w-[85px] shrink-0 items-center justify-center rounded-[3px] bg-white">
            <Image src="/dashboard/uws-logo-cutout.png" alt="UWS Yellow Jackets" width={68} height={68} className="h-[68px] w-[68px]" />
          </span>
          <div className="min-w-0">
            <p className={`${display} text-[13px] font-bold uppercase leading-[13px] tracking-[0.16em] text-[#f5b800]`}>
              UWS Yellow Jackets · Men&apos;s Hockey
            </p>
            <h1 className={`${display} mt-[5px] text-[34px] sm:text-[46px] lg:text-[54px] font-bold uppercase leading-[0.9] tracking-[0.012em]`}>
              Team Dashboard
            </h1>
            <p className="mt-[6px] text-[14px] leading-[17px] text-[#c9ccd1]">{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-[10px] xl:mt-[22px]">
          <Link
            href="/analytics?filter=SEASON"
            className="flex h-[42px] items-center whitespace-nowrap rounded-[3px] border [--border:#3b3f45] bg-[#0d1116]/80 px-[17px] text-[14px] font-semibold text-white hover:[--border:#6b7078]"
          >
            Season Report
          </Link>
          <Link
            href="/players/compare"
            className="flex h-[42px] items-center gap-[9px] whitespace-nowrap rounded-[3px] bg-[#f5b800] px-[17px] text-[14px] font-semibold text-[#0d1116] hover:bg-[#ffc71a]"
          >
            <Users className="h-[16px] w-[16px]" strokeWidth={2} />
            Compare Players
          </Link>
        </div>
      </div>

      <div className="relative mx-[30px] mt-[30px] grid grid-cols-2 border-t [--border:rgba(255,255,255,0.1)] sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`pb-[25px] pt-[14px] ${i > 0 ? "sm:border-l sm:[--border:rgba(255,255,255,0.1)] sm:pl-[28px]" : ""} ${i % 2 === 1 ? "border-l [--border:rgba(255,255,255,0.1)] pl-[20px] sm:pl-[28px]" : ""}`}>
            <p className={`${display} text-[12px] font-semibold uppercase leading-[14px] tracking-[0.14em] text-[#9aa0a6]`}>{s.label}</p>
            <p className={`${display} mt-[6px] text-[30px] font-bold leading-none ${s.gold ? "text-[#f5b800]" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div aria-hidden className="relative h-[3px] bg-[#f0b70f]" />
    </section>
  );
}
