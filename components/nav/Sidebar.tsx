"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/players", label: "Players", icon: "👤" },
  { href: "/practices", label: "Practices", icon: "🏒" },
  { href: "/games", label: "Games", icon: "🥅" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/war-room", label: "War Room", icon: "⚔️" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-30 flex h-screen w-16 md:w-56 shrink-0 flex-col border-r border-border bg-background">
      <Link href="/" className="flex items-center gap-2 px-3 md:px-4 h-14 shrink-0 border-b border-border">
        <Image
          src="/uws-logo.png"
          alt="University of Wisconsin–Superior"
          width={30}
          height={30}
          className="h-7 w-7 shrink-0 rounded-sm"
          priority
        />
        <span className="hidden md:inline text-sm font-semibold tracking-wide text-foreground truncate">
          NORTHSTAR
        </span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
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
                  ? "bg-accent/15 text-accent-strong ring-1 ring-inset ring-accent/40"
                  : "text-muted hover:text-foreground hover:bg-surface-raised"
              )}
            >
              <span className="text-base shrink-0">{tab.icon}</span>
              <span className="hidden md:inline truncate">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
