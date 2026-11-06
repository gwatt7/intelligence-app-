import Link from "next/link";
import { Fragment } from "react";
import { display, eyebrow, panel, HeadingBar } from "@/components/dashboard/dashboardUi";
import type { Leader } from "@/components/dashboard/dashboardData";

function StatCard({ label, leader }: { label: string; leader: Leader | null }) {
  return (
    <div className={`${panel} min-w-0 px-[22px] py-[20px]`}>
      <p className={`${eyebrow} flex items-center gap-[8px] text-[#4b525b]`}>
        <HeadingBar className="h-[14px]" />
        {label}
      </p>
      <p className={`${display} mt-[12px] text-[46px] font-bold leading-none tracking-[-0.01em] text-[#0d1116]`}>
        {leader?.value ?? "–"}
      </p>
      <p className="mt-[9px] truncate text-[14px] font-semibold leading-[18px] text-[#2f333a]">
        {leader ? (
          leader.holders.map((h, i) => (
            <Fragment key={h.playerId}>
              {i > 0 && <span className="text-[#9a9fa6]">, </span>}
              <Link href={`/players/${h.playerId}`} className="hover:text-[#8a6a00] hover:underline">
                {h.label}
              </Link>
            </Fragment>
          ))
        ) : (
          <span className="text-[#9a9fa6]">No data yet this season</span>
        )}
      </p>
    </div>
  );
}

/**
 * Three side-by-side Goals / Assists / Points leader cards. Fed the same
 * `leaders` array (teamLeaders() — indices 0 Points, 1 Goals, 2 Assists)
 * the Team Leaders section below already computes from the active season's
 * live GamePlayerStat totals, so this updates in lockstep with it and never
 * needs its own season/data logic. Ties show every tied player, comma-
 * separated; each name links to that player's profile.
 */
export function PlayerStatsBar({ leaders }: { leaders: (Leader | null)[] }) {
  const [points, goals, assists] = leaders;
  return (
    <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-3">
      <StatCard label="Goals" leader={goals} />
      <StatCard label="Assists" leader={assists} />
      <StatCard label="Points" leader={points} />
    </div>
  );
}
