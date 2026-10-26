import Link from "next/link";
import { Fragment } from "react";
import { display, panel } from "@/components/dashboard/dashboardUi";
import { reportCardPoints, type Leader, type ReportCardRow } from "@/components/dashboard/dashboardData";

/** Player Spotlight photo card (left) — real report-card numbers for that player. */
function Spotlight({ player }: { player: ReportCardRow }) {
  const pts = reportCardPoints(player);
  const stats = [
    { label: "GP", value: player.gamesPlayed },
    { label: "PTS", value: pts },
    { label: "Shots", value: player.shots },
  ];
  const position =
    player.heroImageFocalX !== null && player.heroImageFocalY !== null
      ? `${player.heroImageFocalX}% ${player.heroImageFocalY}%`
      : "50% 22%";

  return (
    <Link
      href={`/players/${player.playerId}`}
      className="group relative flex min-h-[346px] flex-col justify-end overflow-hidden rounded-[4px] bg-[#1a1d22] text-white"
    >
      {player.heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- stored as a data: URI, same as the player profile hero
        <img src={player.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(13,17,22,0) 35%, rgba(13,17,22,0.55) 62%, rgba(13,17,22,0.88) 100%)" }}
      />
      <div className="relative px-[21px] pb-[20px]">
        <span className={`${display} inline-block bg-[#f5b800] px-[10px] py-[3px] text-[12px] font-bold uppercase tracking-[0.14em] text-[#0d1116]`}>
          Player Spotlight
        </span>
        <p className={`${display} mt-[10px] text-[40px] font-bold uppercase leading-none`}>
          <span className="text-[#f5b800]">#{player.jerseyNumber}</span> {player.firstName} {player.lastName}
        </p>
        <div className="mt-[14px] grid grid-cols-3 border-t border-white/25 pt-[12px]">
          {stats.map((s) => (
            <div key={s.label}>
              <p className={`${display} text-[26px] font-bold leading-none`}>{s.value ?? "–"}</p>
              <p className={`${display} mt-[3px] text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#c8cbd0]`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

/** One leader tile, e.g. POINTS 17 / #9 D. Rozsival. */
function LeaderTile({ leader, label }: { leader: Leader | null; label: string }) {
  return (
    <div className="px-[20px] pb-[15px] pt-[19px]">
      <p className={`${display} text-[12px] font-semibold uppercase leading-[16px] tracking-[0.14em] text-[#4b525b]`}>{leader?.label ?? label}</p>
      <p className={`${display} mt-[4px] text-[41px] font-bold leading-none text-[#0d1114]`}>{leader?.value ?? "–"}</p>
      <p className="mt-[3px] truncate text-[13px] font-semibold leading-[16px] text-[#0d1114]">
        {leader
          ? leader.holders.map((h, i) => (
              <Fragment key={h.playerId}>
                {i > 0 && " · "}
                <Link href={`/players/${h.playerId}`} className="hover:underline">
                  {h.label}
                </Link>
              </Fragment>
            ))
          : "No data"}
      </p>
    </div>
  );
}

const LABELS = ["Points", "Goals", "Assists", "Plus / Minus", "Blocked Shots"];

export function TeamLeaders({ spotlight, leaders }: { spotlight: ReportCardRow | null; leaders: (Leader | null)[] }) {
  return (
    <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-2">
      {spotlight ? <Spotlight player={spotlight} /> : <div className={`${panel} min-h-[346px]`} />}
      <div className={`${panel} grid grid-cols-2 overflow-hidden [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t [&>*]:[--border:#eef0f2] [&>*:last-child:nth-child(odd)]:col-span-2`}>
        {LABELS.map((label, i) => (
          <LeaderTile key={label} label={label} leader={leaders[i] ?? null} />
        ))}
      </div>
    </div>
  );
}
