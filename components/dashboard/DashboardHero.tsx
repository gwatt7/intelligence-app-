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
      {/* Cinematic backdrop, back to front: base dark gradient vignette ->
          faint procedural "ice" line texture -> UWS logo watermark ->
          top/bottom fade so it recedes behind the cards below. All CSS/SVG,
          no stock photography — this project only has the real UWS crest
          asset, so depth comes from gradients/textures rather than a
          fabricated arena or player photo. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl select-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, rgba(252,211,6,0.12), transparent 55%), radial-gradient(80% 60% at 85% 10%, rgba(252,211,6,0.08), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #f3f3ee 0px, #f3f3ee 1px, transparent 1px, transparent 46px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] md:h-[480px] md:w-[480px] opacity-[0.14]">
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
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        />
      </div>

      <div className="relative z-10 space-y-4">
        {/* NORTHSTAR title band. Plain <p>, not <h1> — the global heading
            accent-tick rule (main h1/h2/h3::before) assumes a left-aligned
            heading; on this full-width centered title it renders as a stray
            mark at the container's left edge instead of beside the text. */}
        <div className="text-center pt-6 pb-2">
          <h1 className="sr-only">NORTHSTAR Dashboard</h1>
          <p
            className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none"
            style={{
              color: "#fcd306",
              WebkitTextStroke: "1.5px #f3f3ee",
              textShadow:
                "1px 0 0 #f3f3ee, -1px 0 0 #f3f3ee, 0 1px 0 #f3f3ee, 0 -1px 0 #f3f3ee, 0 0 32px rgba(252,211,6,0.4)",
            }}
          >
            NORTHSTAR
          </p>
          <p className="mt-1.5 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-muted">
            {teamName}
          </p>
          <div className="mx-auto mt-2.5 h-[3px] w-10 rounded-full bg-accent" />
          <p className="mt-2.5 text-sm text-muted">Season {seasonName}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
