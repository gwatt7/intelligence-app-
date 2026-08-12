import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Dashboard-only hero + background treatment. Uses the actual UWS logo
 * asset (public/uws-logo.png) — there is no separate NORTHSTAR graphic in
 * the project, so the NORTHSTAR identity is expressed as a large styled
 * wordmark (yellow fill, white outline) rather than a fabricated logo.
 *
 * Layering (back to front): page background -> UWS logo watermark -> the
 * dashboard's cards (passed in as `children`) -> the NORTHSTAR title, which
 * renders above everything in its own top band.
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
    <div className="relative">
      {/* Large UWS logo watermark, centered behind the whole dashboard */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none">
        <div className="relative h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] md:h-[480px] md:w-[480px] opacity-[0.16]">
          <Image
            src="/uws-logo.png"
            alt=""
            fill
            className="object-contain"
            style={{ filter: "drop-shadow(0 0 45px rgba(252,211,6,0.45)) drop-shadow(0 0 90px rgba(252,211,6,0.2))" }}
            priority
          />
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        {/* NORTHSTAR title band. Plain <p>, not <h1> — the global heading
            accent-tick rule (main h1/h2/h3::before) assumes a left-aligned
            heading; on this full-width centered title it renders as a stray
            mark at the container's left edge instead of beside the text. */}
        <div className="text-center pt-1 pb-1">
          <h1 className="sr-only">NORTHSTAR Dashboard</h1>
          <p
            className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none"
            style={{
              color: "#fcd306",
              WebkitTextStroke: "1.5px #f3f3ee",
              textShadow:
                "1px 0 0 #f3f3ee, -1px 0 0 #f3f3ee, 0 1px 0 #f3f3ee, 0 -1px 0 #f3f3ee, 0 0 24px rgba(252,211,6,0.35)",
            }}
          >
            NORTHSTAR
          </p>
          <p className="mt-1.5 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-muted">
            {teamName}
          </p>
          <p className="mt-0.5 text-sm text-muted">Season {seasonName}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
