import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Shared building blocks for the dashboard's reference design.
//
// Border colors: globals.css sets every element's border color from the
// --border variable, and that rule beats Tailwind's border-color classes.
// So dashboard components set the variable instead, e.g. [--border:#eef0f2].

/** Condensed athletic display face (headings, labels, big numbers). */
export const display = "font-[family-name:var(--font-dash-display)]";

/** Small uppercase condensed label, e.g. "RECORD", "POINTS". */
export const eyebrow = `${display} text-[12px] font-semibold uppercase tracking-[0.14em]`;

/** White card with a hairline border. */
export const panel = "bg-white border [--border:#e5e7eb] rounded-[4px]";

/** The gold slanted bar drawn before section and card titles. */
export function HeadingBar({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block h-[20px] w-[7px] shrink-0 -skew-x-[16deg] bg-[#f5b800]", className)} />;
}

/** Page section heading, e.g. "/ PERFORMANCE SNAPSHOT" with an optional link on the right. */
export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-[19px] flex h-[24px] items-center justify-between gap-4">
      <h2 className={`${display} flex items-center gap-[10px] text-[25px] font-bold uppercase leading-none tracking-[0.01em] text-[#181c1f]`}>
        <HeadingBar />
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Small dark text link used on the right of headings ("All team stats ›"). */
export function HeadingLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-[13px] font-semibold text-[#181c1f] hover:text-[#8a6a00] whitespace-nowrap">
      {children}
    </Link>
  );
}

/** Card header row: slanted bar + title on the left, optional link on the right. */
export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex h-[56px] items-center justify-between gap-3 border-b [--border:#eef0f2] px-[18px]">
      <h3 className={`${display} flex items-center gap-[10px] text-[22px] font-bold uppercase leading-none text-[#0d1116]`}>
        <HeadingBar />
        {title}
      </h3>
      {action}
    </div>
  );
}

/** Pale-amber icon tile used in the Last Game / Next Mini Game empty rows. */
export function SoftIconTile({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[4px] bg-[#fef3c7] text-[#8a6d00]">
      {children}
    </span>
  );
}

/** "2026-2027" → "2026-27" (or "2026–27" with an en dash). */
export function shortSeason(name: string, dash: "-" | "–" = "-"): string {
  const m = name.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
  return m ? `${m[1]}${dash}${m[2].slice(2)}` : name;
}

/** "Saint John's (Minn.)" → "Saint John's" — display only. */
export function shortOpponent(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "");
}
