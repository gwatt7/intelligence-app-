import { Anton } from "next/font/google";
import type { ReactNode } from "react";

const anton = Anton({ weight: "400", subsets: ["latin"] });

/**
 * Dashboard-only NORTHSTAR header. Sits directly on the page background —
 * no card, no border, no background image — per request. "NORTH" is solid
 * white, "STAR" is a gold gradient, both in Anton (the closest available
 * athletic/collegiate display font to the supplied reference), with a
 * slight skew for the athletic wordmark look.
 */
export function DashboardHero({
  children,
  teamName,
  seasonName,
}: {
  children: ReactNode;
  teamName: string;
  seasonName: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="sr-only">NORTHSTAR Dashboard</h1>
        <p
          className={`${anton.className} text-6xl sm:text-7xl md:text-8xl uppercase leading-none tracking-tight`}
          style={{ transform: "skewX(-6deg)", transformOrigin: "left" }}
        >
          <span
            style={{
              color: "#f3f3ee",
              WebkitTextStroke: "1.5px #0a0a0a",
              textShadow: "0 2px 0 rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.35)",
            }}
          >
            NORTH
          </span>
          <span
            style={{
              backgroundImage: "linear-gradient(180deg, #ffe14d 0%, #fcd306 55%, #d99a06 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "1.5px #0a0a0a",
              textShadow: "0 0 28px rgba(252,211,6,0.45)",
            }}
          >
            STAR
          </span>
        </p>
        <p className="mt-2 text-xs sm:text-sm font-medium uppercase tracking-[0.3em] text-muted" title={teamName}>
          UWS Yellow Jackets
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-[3px] w-10 rounded-full bg-accent shrink-0" />
          <p className="text-sm text-muted">Season {seasonName}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
