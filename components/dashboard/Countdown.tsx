"use client";

import { useEffect, useState } from "react";
import { display } from "@/components/dashboard/dashboardUi";

function parts(targetMs: number, nowMs: number) {
  const totalMin = Math.max(0, Math.floor((targetMs - nowMs) / 60000));
  return { days: Math.floor(totalMin / 1440), hrs: Math.floor((totalMin % 1440) / 60), min: totalMin % 60 };
}

/** Live days / hours / minutes until the next game's puck drop. */
export function Countdown({ target, renderedAt }: { target: string; renderedAt: string }) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState(() => new Date(renderedAt).getTime());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const { days, hrs, min } = parts(targetMs, now);
  const cells = [
    { value: days, label: "Days" },
    { value: hrs, label: "Hrs" },
    { value: min, label: "Min" },
  ];

  return (
    <div className="flex gap-[2px]" role="timer" aria-label={`${days} days, ${hrs} hours, ${min} minutes until puck drop`}>
      {cells.map((c) => (
        <div key={c.label} className="flex h-[64px] w-[76px] flex-col items-center justify-center bg-[#0d2045]">
          <span suppressHydrationWarning className={`${display} text-[30px] font-bold leading-none text-white`}>
            {String(c.value).padStart(2, "0")}
          </span>
          <span className={`${display} mt-[5px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b7c0d6]`}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
