"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/players", label: "Players", icon: "👤" },
  { href: "/mini-games", label: "Mini Games", icon: "🎮" },
  { href: "/games", label: "Games", icon: "🥅" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/weekly-rankings", label: "Weekly Rankings", icon: "🏆" },
  { href: "/war-room", label: "War Room", icon: "⚔️" },
] as const;

export function Sidebar({
  buildSha,
  buildEnv,
  teamName,
  seasonName,
}: {
  buildSha?: string;
  buildEnv?: string;
  teamName?: string | null;
  seasonName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="relative sticky top-0 z-30 flex h-screen w-16 md:w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-background">
      {/* Subtle arena/ice texture low in the sidebar, purely CSS — no stock
          photography is used anywhere in this project (see PlayerPhoto). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(70deg, #f3f3ee 0px, #f3f3ee 1px, transparent 1px, transparent 38px)",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 top-1/3 h-40 w-40 rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "radial-gradient(circle, #fcd306, transparent 70%)" }}
      />

      <Link href="/" className="relative flex items-center gap-2 px-3 md:px-4 h-14 shrink-0 border-b border-border">
        <Image
          src="/uws-logo.png"
          alt="University of Wisconsin–Superior"
          width={30}
          height={30}
          className="h-7 w-7 shrink-0 rounded-sm"
          priority
        />
        <span className="hidden md:inline text-sm font-bold tracking-wide truncate">
          <span className="text-foreground">NORTH</span>
          <span className="text-accent-strong">STAR</span>
        </span>
      </Link>

      <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/15 text-accent-strong ring-1 ring-inset ring-accent/40 shadow-[0_0_16px_rgba(252,211,6,0.15)]"
                  : "text-muted hover:text-foreground hover:bg-surface-raised"
              )}
            >
              <span className="text-base shrink-0">{tab.icon}</span>
              <span className="hidden md:inline truncate">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom-left brand block — same UWS logo as the top, real team/season data */}
      {(teamName || seasonName) && (
        <div className="relative shrink-0 border-t border-border px-3 md:px-4 py-3 flex items-center md:items-start gap-2.5">
          <Image
            src="/uws-logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-sm opacity-90"
          />
          <div className="hidden md:block min-w-0">
            {teamName && <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground truncate">{teamName}</p>}
            {seasonName && <p className="text-[11px] text-muted-2 truncate">{seasonName}</p>}
          </div>
        </div>
      )}

      {buildSha && (
        <div className="relative hidden md:block shrink-0 border-t border-border px-3 py-2 text-[10px] text-muted-2">
          Build {buildSha}
          {buildEnv ? ` · ${buildEnv}` : ""}
        </div>
      )}
    </aside>
  );
}
