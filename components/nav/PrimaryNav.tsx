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

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-2">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-2">
            <Image
              src="/uws-logo.png"
              alt="University of Wisconsin–Superior"
              width={30}
              height={30}
              className="h-7 w-7 sm:h-[30px] sm:w-[30px] rounded-sm"
              priority
            />
            <span className="hidden sm:inline text-sm font-semibold tracking-wide text-foreground">
              Hockey Intelligence
            </span>
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
                      ? "bg-accent/15 text-accent-strong ring-1 ring-inset ring-accent/40"
                      : "text-muted hover:text-foreground hover:bg-surface-raised"
                  )}
                >
                  <span className="mr-1">{tab.icon}</span>
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
