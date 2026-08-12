import Link from "next/link";

const CATEGORIES = [
  { href: "/team", icon: "👥", label: "Team", description: "Roster & team info" },
  { href: "/players", icon: "👤", label: "Players", description: "Profiles, stats & trends" },
  { href: "/practices", icon: "🏒", label: "Practices", description: "Plan & log practices" },
  { href: "/games", icon: "🥅", label: "Games", description: "Track games & results" },
  { href: "/analytics", icon: "📈", label: "Analytics", description: "Turn data into decisions" },
  { href: "/war-room", icon: "⚔️", label: "War Room", description: "Plan. Play. Review." },
] as const;

export function CategoryBubbles() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {CATEGORIES.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="group relative flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-surface-raised hover:shadow-[0_14px_36px_-12px_rgba(252,211,6,0.3)]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-2xl transition-transform duration-200 group-hover:scale-110">
            {c.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold uppercase tracking-wide text-foreground">{c.label}</span>
            <span className="block text-sm text-muted truncate">{c.description}</span>
          </span>
          <span className="ml-auto text-lg text-muted-2 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent-strong">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
