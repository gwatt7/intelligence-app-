"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, User, Gamepad2, BookOpen, TrendingUp, Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/team", label: "Team", icon: Users },
  { href: "/players", label: "Players", icon: User },
  { href: "/mini-games", label: "Mini Games", icon: Gamepad2 },
  { href: "/games", label: "Games", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/weekly-rankings", label: "Weekly Rankings", icon: Trophy },
  { href: "/war-room", label: "War Room", icon: Swords },
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
      {/* Arena/stadium-seating photo low in the sidebar — the supplied
          decorative crop, generic stadium imagery with nothing identifying,
          faded into the sidebar's dark background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] opacity-30"
        style={{
          maskImage: "linear-gradient(to top, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 40%, transparent 100%)",
        }}
      >
        <Image src="/dashboard/sidebar-arena-photo.png" alt="" fill className="object-cover" />
      </div>
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

      <nav className="relative flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.label}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-contrast shadow-[0_0_18px_rgba(252,211,6,0.3)]"
                  : "text-muted hover:text-foreground hover:bg-surface-raised"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="hidden md:inline truncate">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom-left brand block — same UWS logo as the top. "UWS Yellow
          Jackets" is fixed brand copy (same treatment as the "NORTHSTAR"
          wordmark above, not pulled from an editable field); the season
          line is real data from the existing season state, per team. */}
      {seasonName && (
        <div className="relative shrink-0 border-t border-border px-3 md:px-4 py-3 flex items-center md:items-start gap-2.5">
          <Image
            src="/uws-logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-sm opacity-90"
          />
          <div className="hidden md:block min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground truncate" title={teamName ?? undefined}>
              UWS Yellow Jackets
            </p>
            <p className="text-[11px] text-muted-2 truncate">{seasonName}</p>
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
