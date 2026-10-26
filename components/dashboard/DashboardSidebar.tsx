"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, ChartLine, ListOrdered, ChevronDown, Gamepad2, LayoutGrid, Trophy, User, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { dashFontVars } from "@/components/dashboard/dashboardFonts";
import { display, shortSeason } from "@/components/dashboard/dashboardUi";

// Same destinations as the app's existing sidebar tabs, grouped as in the design.
const GROUPS = [
  {
    label: "Club",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/team", label: "Team", icon: Users },
      { href: "/players", label: "Players", icon: User },
    ],
  },
  {
    label: "Game Day",
    items: [
      { href: "/games", label: "Games", icon: Calendar },
      { href: "/mini-games", label: "Mini Games", icon: Gamepad2 },
      { href: "/war-room", label: "War Room", icon: X },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: ChartLine },
      { href: "/weekly-rankings", label: "Weekly Rankings", icon: Trophy },
      { href: "/rankings", label: "Overall Rankings", icon: ListOrdered },
    ],
  },
] as const;

/** Sidebar shown on the dashboard, styled to the dashboard design. */
export function DashboardSidebar({
  buildSha,
  buildEnv,
  seasonName,
}: {
  buildSha?: string;
  buildEnv?: string;
  seasonName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        dashFontVars,
        "sticky top-0 z-30 flex h-screen w-16 md:w-56 shrink-0 flex-col border-r [--border:#1a1c20] bg-[#0b0d11] font-[family-name:var(--font-dash-body)]"
      )}
    >
      <Link href="/dashboard" className="flex h-[69px] shrink-0 items-center gap-[10px] border-b [--border:#1a1c20] px-[16px] md:px-[24px]">
        <Image src="/dashboard/uws-logo-cutout.png" alt="University of Wisconsin–Superior" width={32} height={32} className="h-[32px] w-[32px] shrink-0" priority />
        <span className={`${display} hidden text-[25px] font-extrabold italic leading-none tracking-[0.01em] md:inline`}>
          <span className="text-white">NORTH</span>
          <span className="text-[#f5b800]">STAR</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col overflow-y-auto px-[11px] pb-4 pt-[15px]">
        {GROUPS.map((g, gi) => (
          <div key={g.label} className={gi > 0 ? "mt-[21px]" : ""}>
            <p className={`${display} mb-[4px] hidden px-[12px] text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6b7078] md:block`}>
              {g.label}
            </p>
            <ul className="space-y-0">
              {g.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={cn(
                        "relative flex h-[42px] items-center gap-[12px] rounded-[4px] px-[13px] text-[14px] transition-colors",
                        active ? "bg-[#31280d] font-semibold text-white" : "font-medium text-[#dcdfe4] hover:bg-white/[0.04] hover:text-white"
                      )}
                    >
                      {active && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] rounded-l-[4px] bg-[#e8b61c]" />}
                      <Icon className={cn("h-[16px] w-[16px] shrink-0", active ? "text-[#e8b61c]" : "text-[#9aa0a6]")} strokeWidth={1.75} />
                      <span className="hidden truncate md:inline">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {seasonName && (
        <Link href="/team" className="flex shrink-0 items-center gap-[12px] border-t [--border:#1a1c20] px-[20px] py-[16px] hover:bg-white/[0.03] md:px-[28px]" title="Team & season settings">
          <Image src="/dashboard/uws-logo-cutout.png" alt="" width={26} height={26} className="h-[26px] w-[26px] shrink-0" />
          <span className="hidden min-w-0 flex-1 md:block">
            <span className="block text-[13px] font-semibold leading-[1.25] text-white">UWS Yellow Jackets</span>
            <span className="block text-[12px] text-[#8a9099]">{shortSeason(seasonName, "–")} Season</span>
          </span>
          <ChevronDown className="hidden h-[15px] w-[15px] text-[#8a9099] md:block" strokeWidth={2} />
        </Link>
      )}

      {buildSha && (
        <div className="hidden shrink-0 border-t [--border:#1a1c20] px-3 py-2 text-[10px] text-[#5b626b] md:block">
          Build {buildSha}
          {buildEnv ? ` · ${buildEnv}` : ""}
        </div>
      )}
    </aside>
  );
}
