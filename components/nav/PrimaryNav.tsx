"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/team", label: "Team" },
  { href: "/players", label: "Players" },
  { href: "/practices", label: "Practices" },
  { href: "/games", label: "Games" },
  { href: "/analytics", label: "Analytics" },
  { href: "/war-room", label: "War Room" },
] as const;

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-2">
          <Link href="/" className="mr-2 shrink-0 text-sm font-semibold tracking-wide text-foreground">
            🏒 <span className="hidden sm:inline">Hockey Intelligence</span>
          </Link>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent/15 text-accent-strong"
                      : "text-muted hover:text-foreground hover:bg-surface-raised"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
