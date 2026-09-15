import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Dashboard-only hero banner. The atmospheric photo (public/dashboard/hero-photo.png)
 * is a decorative crop supplied by the user — generic hockey-gear imagery,
 * not depicting any specific identifiable person or trademark, so it's used
 * directly per their request. All real identity/text content (NORTHSTAR,
 * team, season) stays as live HTML on top, not baked into the image.
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
      <div className="relative isolate overflow-hidden rounded-2xl border border-border h-[300px] sm:h-[360px] md:h-[420px]">
        {/* Backdrop, back to front */}
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute inset-0 bg-background" />

          <Image
            src="/dashboard/hero-photo.png"
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: "60% 35%" }}
            priority
          />

          {/* Diagonal gold light ray accent, matching the reference */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              background:
                "repeating-linear-gradient(115deg, transparent 0px, transparent 60px, rgba(252,211,6,0.5) 61px, transparent 90px)",
              maskImage: "radial-gradient(70% 90% at 78% 15%, black, transparent)",
              WebkitMaskImage: "radial-gradient(70% 90% at 78% 15%, black, transparent)",
            }}
          />

          {/* Left-to-right vignette so the title stays legible over the photo */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, var(--background) 0%, rgba(10,10,10,0.9) 34%, rgba(10,10,10,0.35) 60%, transparent 78%)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))" }}
          />
        </div>

        {/* Decorative top indicator dots */}
        <div aria-hidden className="absolute top-4 inset-x-0 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>

        {/* Title block — left-aligned, vertically centered in the banner */}
        <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10">
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
          <p className="mt-1.5 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-muted" title={teamName}>
            UWS Yellow Jackets
          </p>
          <div className="mt-2.5 h-[3px] w-10 rounded-full bg-accent" />
          <p className="mt-2.5 text-sm text-muted">Season {seasonName}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
