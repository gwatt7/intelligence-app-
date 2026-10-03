import { Anton } from "next/font/google";
import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const anton = Anton({ weight: "400", subsets: ["latin"] });

/**
 * Dashboard-only NORTHSTAR header. The hockey-rink photo (dashboard-bg-
 * arena.jpg) is the Dashboard's background — deliberately separate from
 * whatever reference mockup informs the UI layout above it — fixed-
 * attachment so it reads as one continuous photo behind the hero band AND
 * the cards below, not an image confined to the hero. The hero band itself
 * keeps the reference's proportions (fixed height, wordmark + subtitle +
 * season line lower-left, Compare Players pill top-right) with its own
 * left-to-right gradient over the shared background so the wordmark stays
 * legible. "NORTH" is solid white, "STAR" is a gold gradient, both in
 * Anton (the closest available athletic/collegiate display font to the
 * reference), with a slight skew for the athletic wordmark look.
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
    // Bleeds out to the edges of <main>'s own padding (mx-4/6, my-6 in
    // app/layout.tsx) and re-applies the same padding inside, so the rink
    // photo fills the whole content area edge-to-edge behind everything.
    <div className="relative -mx-4 sm:-mx-6 -my-6 px-4 sm:px-6 py-6 space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url(/dashboard/dashboard-bg-arena.jpg)", backgroundAttachment: "fixed" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-background/55" />

      <div className="relative h-[260px] sm:h-[300px] md:h-[340px] flex flex-col justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(90deg, var(--background) 0%, var(--background) 15%, rgba(10,10,10,0.55) 40%, rgba(10,10,10,0.2) 65%, transparent 90%)",
          }}
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
