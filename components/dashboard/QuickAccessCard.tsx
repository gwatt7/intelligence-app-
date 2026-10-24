import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, ClipboardCheck, Clock, Users } from "lucide-react";
import { CardHeader, panel } from "@/components/dashboard/dashboardUi";

/** Crossed sticks with a puck — War Room mark. */
function WarRoomIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={className} aria-hidden>
      <path d="M5 4l14 16M19 4L5 20" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

const LINKS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/team", label: "Roster", icon: <Users className="h-[18px] w-[18px]" strokeWidth={1.75} /> },
  { href: "/mini-games", label: "Practice Tracking", icon: <ClipboardCheck className="h-[18px] w-[18px]" strokeWidth={1.75} /> },
  { href: "/games", label: "Game Tracking", icon: <Clock className="h-[18px] w-[18px]" strokeWidth={1.75} /> },
  { href: "/war-room", label: "War Room", icon: <WarRoomIcon className="h-[18px] w-[18px]" /> },
];

/** Shortcuts to existing pages. */
export function QuickAccessCard() {
  return (
    <section className={panel}>
      <CardHeader title="Quick Access" />
      <ul>
        {LINKS.map((l, i) => (
          <li key={l.href} className={i > 0 ? "border-t [--border:#eef0f2]" : ""}>
            <Link href={l.href} className="flex h-[55px] items-center gap-[14px] px-[18px] hover:bg-[#fafafa]">
              <span className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-[4px] bg-[#0d1116] text-[#f5b800]">
                {l.icon}
              </span>
              <span className="flex-1 text-[15px] font-semibold text-[#0d1116]">{l.label}</span>
              <ChevronRight className="h-[16px] w-[16px] text-[#6b7078]" strokeWidth={2} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
