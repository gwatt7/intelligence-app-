import { Anton } from "next/font/google";
import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const anton = Anton({ weight: "400", subsets: ["latin"] });

/**
 * Dashboard-only NORTHSTAR header. A fixed-height image band (the supplied
 * helmet/arena photo, right-aligned, dark-gradient into the wordmark) sits
 * above the rest of the dashboard content, which returns to the page's
 * normal dark background — matching the reference, where only this band
 * carries imagery and everything below it is flat. "NORTH" is solid white,
 * "STAR" is a gold gradient, both in Anton (the closest available
 * athletic/collegiate display font to the reference), with a slight skew
 * for the athletic wordmark look.
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
      {/* Bleeds out to the edges of <main>'s own padding (mx-4/6, my-6 in
          app/layout.tsx) and re-applies the same padding inside, so the
          hero photo fills the content area edge-to-edge at the top without
          shifting anything below it — only this band, not the whole page. */}
      <div className="relative -mx-4 sm:-mx-6 -mt-6 px-4 sm:px-6 pt-8 pb-6 sm:pb-8 h-[280px] sm:h-[320px] md:h-[360px] flex flex-col justify-between overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-cover"
          style={{ backgroundImage: "url(/dashboard/hero-photo.png)", backgroundPosition: "85% center" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(90deg, var(--background) 0%, var(--background) 18%, rgba(10,10,10,0.5) 36%, rgba(10,10,10,0.15) 58%, transparent 80%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "linear-gradient(0deg, rgba(10,10,10,0.25) 0%, transparent 15%, transparent 85%, rgba(10,10,10,0.15) 100%)" }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <h1 className="sr-only">NORTHSTAR Dashboard</h1>
          <ButtonLink href="/players/compare" variant="secondary" className="!rounded-full !px-4 !py-2 text-xs shrink-0">
            <Users className="h-4 w-4" strokeWidth={2} />
            Compare Players
          </ButtonLink>
        </div>

        <div className="relative">
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
          <p className="mt-2 text-xs sm:text-sm font-medium uppercase tracking-[0.3em] text-foreground" title={teamName}>
            UWS Yellow Jackets
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-[3px] w-10 rounded-full bg-accent shrink-0" />
            <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-muted">Season {seasonName}</p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
