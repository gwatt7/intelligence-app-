import Link from "next/link";
import { cn } from "@/lib/cn";
import type { DefensePair, ForwardLine, RatedPlayer, SlotAssignment } from "@/lib/lineup-builder";

const SLOT_LABEL: Record<string, string> = { LW: "Left Wing", C: "Center", RW: "Right Wing", LD: "Left D", RD: "Right D", G: "Goalie" };

function ratingTone(r: number): string {
  if (r >= 65) return "text-positive";
  if (r >= 45) return "text-foreground";
  return "text-muted";
}

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-mono text-sm font-semibold tabular-nums", ratingTone(value), className)} title="Overall rating (0–100, vs. teammates)">
      {Math.round(value)}
    </span>
  );
}

function hand(p: RatedPlayer): string {
  return p.shoots === "LEFT" ? "L" : p.shoots === "RIGHT" ? "R" : "–";
}

/** One player in one lineup spot. */
export function SlotCard({ s }: { s: SlotAssignment }) {
  const label = SLOT_LABEL[s.slot] ?? s.slot;
  if (!s.player) {
    return (
      <div className="flex min-h-[112px] flex-col justify-center rounded-lg border border-dashed border-border p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">{label}</p>
        <p className="mt-1 text-sm text-muted">Open spot</p>
      </div>
    );
  }
  const p = s.player;
  return (
    <Link
      href={`/players/${p.id}`}
      className="group flex min-h-[112px] flex-col rounded-lg border border-border bg-surface-raised p-3 transition-colors hover:border-accent/60"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">{label}</p>
        <Rating value={p.ratings.overall} />
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-foreground group-hover:text-accent-strong">
        <span className="font-mono text-muted">#{p.jerseyNumber}</span> {p.name}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {p.style} · Shoots {hand(p)}
      </p>
      <p className="mt-auto pt-1.5 text-[11px] text-muted-2">{p.statLine}</p>
      {s.note && <p className="mt-1 text-[11px] font-medium text-accent-strong">{s.note}</p>}
    </Link>
  );
}

function Notes({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <ul className="mt-3 space-y-1">
      {notes.map((n) => (
        <li key={n} className="flex gap-2 text-xs text-muted">
          <span aria-hidden className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-accent" />
          {n}
        </li>
      ))}
    </ul>
  );
}

export function ForwardLineCard({ line }: { line: ForwardLine }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Line {line.number}</h3>
        <span className="text-xs text-muted">
          Avg rating <Rating value={line.rating} className="ml-1" />
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SlotCard s={line.lw} />
        <SlotCard s={line.c} />
        <SlotCard s={line.rw} />
      </div>
      <Notes notes={line.notes} />
    </div>
  );
}

export function DefensePairCard({ pair }: { pair: DefensePair }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pair {pair.number}</h3>
        <span className="text-xs text-muted">
          Avg rating <Rating value={pair.rating} className="ml-1" />
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <SlotCard s={pair.ld} />
        <SlotCard s={pair.rd} />
      </div>
      <Notes notes={pair.notes} />
    </div>
  );
}

/** Compact row for goalies, extras and players who are out. */
export function PlayerRow({ p, right }: { p: RatedPlayer; right?: React.ReactNode }) {
  return (
    <Link href={`/players/${p.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-surface-raised">
      <span className="min-w-0">
        <span className="block truncate text-sm text-foreground">
          <span className="font-mono text-muted">#{p.jerseyNumber}</span> {p.name}
        </span>
        <span className="block truncate text-[11px] text-muted-2">{p.statLine}</span>
      </span>
      {right}
    </Link>
  );
}
