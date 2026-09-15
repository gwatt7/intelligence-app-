import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Dashboard-only hero banner. There is no licensed hockey action photo or
 * separate NORTHSTAR graphic asset in this project (see PlayerPhoto.tsx and
 * the project's standing rule against fabricating imagery), so the
 * cinematic look is built entirely from CSS gradients plus one hand-authored
 * SVG hockey-stick-and-puck silhouette instead of a stock photo — same
 * "real assets only" rule already applied to player headshots.
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
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #14120a 60%, #0a0a0a 100%)" }} />

          {/* Diagonal gold light rays, upper right */}
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              background:
                "repeating-linear-gradient(115deg, transparent 0px, transparent 60px, rgba(252,211,6,0.5) 61px, transparent 90px)",
              maskImage: "radial-gradient(70% 90% at 78% 15%, black, transparent)",
              WebkitMaskImage: "radial-gradient(70% 90% at 78% 15%, black, transparent)",
            }}
          />

          {/* UWS crest watermark, upper right */}
          <div className="absolute -top-6 right-6 sm:right-10 h-40 w-40 sm:h-52 sm:w-52 opacity-[0.16]">
            <Image
              src="/uws-logo.png"
              alt=""
              fill
              className="object-contain"
              style={{ filter: "drop-shadow(0 0 35px rgba(252,211,6,0.4))" }}
              priority
            />
          </div>

          {/* Hockey-stick-and-puck silhouette, bleeding off the bottom-right */}
          <svg
            aria-hidden
            viewBox="0 0 520 420"
            className="absolute -right-6 -bottom-10 h-[280px] w-[340px] sm:h-[340px] sm:w-[420px] md:h-[400px] md:w-[480px] opacity-90"
            style={{ filter: "drop-shadow(0 0 24px rgba(0,0,0,0.6))" }}
          >
            <g transform="rotate(-18 260 210)">
              <rect x="150" y="40" width="26" height="300" rx="10" fill="#0f0f0d" stroke="#fcd306" strokeOpacity="0.35" strokeWidth="2" />
              <path d="M150 300 L176 300 L230 360 Q236 372 224 376 L150 376 Z" fill="#0f0f0d" stroke="#fcd306" strokeOpacity="0.35" strokeWidth="2" />
            </g>
            <circle cx="360" cy="330" r="26" fill="#0f0f0d" stroke="#fcd306" strokeOpacity="0.35" strokeWidth="2" />
            <g stroke="#fcd306" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round">
              <line x1="300" y1="300" x2="340" y2="280" />
              <line x1="310" y1="330" x2="355" y2="315" />
            </g>
          </svg>

          {/* Left-to-right vignette so the title stays legible over the graphic */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, var(--background) 0%, rgba(10,10,10,0.85) 30%, transparent 65%)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))" }}
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
