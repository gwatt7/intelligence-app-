import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { PlayerRating, RankingPeriod } from "@/lib/overall-rankings";
import { PERIOD_LABEL } from "@/lib/overall-rankings";

const POSITION_LABEL = { FORWARD: "F", DEFENSE: "D", GOALIE: "G" } as const;

/** Subtle gold / silver / bronze rank chips for the top three. */
const TOP_CHIP = [
  "border-accent/60 bg-accent/15 text-accent-strong",
  "border-[#c7ccd4]/50 bg-[#c7ccd4]/10 text-[#dfe3ea]",
  "border-[#c98b4f]/50 bg-[#c98b4f]/10 text-[#e0a46c]",
];

function Movement({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-2">—</span>;
  if (value === 0) return <span className="text-muted" title="No change since before the latest game">→</span>;
  return (
    <span className={value > 0 ? "text-positive" : "text-negative"} title="Places moved since before the most recent game/session">
      {value > 0 ? "▲" : "▼"}
      {Math.abs(value)}
    </span>
  );
}

function RatingBar({ rating, muted }: { rating: number | null; muted?: boolean }) {
  if (rating === null) return <span className="text-sm text-muted-2">Not yet rated</span>;
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("w-11 text-right font-mono text-base font-semibold", muted ? "text-muted" : "text-foreground")}>{rating.toFixed(1)}</span>
      <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-surface-raised sm:block">
        <div className={cn("h-full rounded-full", muted ? "bg-muted-2" : "bg-accent")} style={{ width: `${rating}%` }} />
      </div>
    </div>
  );
}

function Breakdown({ p, period }: { p: PlayerRating; period: RankingPeriod }) {
  return (
    <div className="border-t border-border bg-background/40 px-4 py-4 text-sm">
      {p.reasons.length > 0 && (
        <p className="mb-3 text-xs text-warning">
          {p.status === "unrated" ? "Not yet rated: " : "Provisional: "}
          {p.reasons.join(" · ")}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="text-left uppercase tracking-wide text-muted-2">
              <th className="py-1.5 pr-3 font-medium">Category</th>
              <th className="py-1.5 pr-3 font-medium">Underlying stats</th>
              <th className="py-1.5 pr-3 font-medium">Value (adjusted)</th>
              <th className="py-1.5 pr-3 text-right font-medium">Score</th>
              <th className="py-1.5 pr-3 text-right font-medium">Weight</th>
              <th className="py-1.5 text-right font-medium">Effect on rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {p.categories.map((c) => (
              <tr key={c.key} className={c.score === null ? "text-muted-2" : "text-foreground"}>
                <td className="py-2 pr-3 font-medium">{c.label}</td>
                <td className="py-2 pr-3 text-muted">{c.detail}</td>
                <td className="py-2 pr-3">
                  {c.score === null ? (
                    <span className="italic">{c.missingReason} — excluded</span>
                  ) : (
                    <>
                      {c.value} <span className="text-muted-2">({c.adjusted})</span>
                    </>
                  )}
                </td>
                <td className="py-2 pr-3 text-right font-mono">{c.score === null ? "—" : c.score.toFixed(1)}</td>
                <td className="py-2 pr-3 text-right font-mono">
                  {Math.round(c.weight * 100)}%
                  {c.score !== null && Math.abs(c.effectiveWeight - c.weight) > 0.005 && (
                    <span className="text-muted-2"> → {Math.round(c.effectiveWeight * 100)}%</span>
                  )}
                </td>
                <td
                  className={cn(
                    "py-2 text-right font-mono",
                    c.score === null ? "" : c.contribution > 0 ? "text-positive" : c.contribution < 0 ? "text-negative" : "text-muted"
                  )}
                >
                  {c.score === null ? "—" : `${c.contribution > 0 ? "+" : ""}${c.contribution.toFixed(1)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        {p.rating !== null ? (
          <>
            Rating = 50 (average) + effects above = <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>.{" "}
          </>
        ) : null}
        Period: {PERIOD_LABEL[period]} · Sample: {p.sampleNote}
        {p.coverage < 1 && p.rating !== null && ` · ${Math.round(p.coverage * 100)}% of category weight had data (missing categories are excluded and the rest re-weighted)`}
        {p.context && ` · ${p.context}`}
      </p>
      <p className="mt-1 text-xs text-muted-2">
        &ldquo;Adjusted&rdquo; values blend small samples toward the group average so a few games can&apos;t produce an extreme score.
      </p>
    </div>
  );
}

function Row({ p, period, showPosition }: { p: PlayerRating; period: RankingPeriod; showPosition: boolean }) {
  const muted = p.status !== "ranked";
  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_auto_1.25rem] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-surface-raised lg:grid-cols-[3rem_minmax(0,1.6fr)_2.5rem_9rem_3rem_minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem_1.25rem] [&::-webkit-details-marker]:hidden">
        <span>
          {p.rank !== null ? (
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold",
                p.rank <= 3 ? TOP_CHIP[p.rank - 1] : "border-border text-muted"
              )}
            >
              {p.rank}
            </span>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center text-xs text-muted-2">—</span>
          )}
        </span>
        <span className="min-w-0">
          <Link href={`/players/${p.playerId}`} className="font-medium text-foreground hover:text-accent-strong">
            #{p.jerseyNumber} {p.name}
          </Link>
          {p.status === "provisional" && (
            <Badge tone="warning" className="ml-2 align-middle">
              Provisional
            </Badge>
          )}
          <span className="block text-xs text-muted lg:hidden">
            {showPosition && `${POSITION_LABEL[p.position]} · `}
            {p.sampleNote}
            {p.strongest && ` · Best: ${p.strongest}`}
          </span>
        </span>
        <span className="hidden text-sm text-muted lg:block">{showPosition ? POSITION_LABEL[p.position] : "G"}</span>
        <span className="justify-self-end lg:justify-self-start">
          <RatingBar rating={p.rating} muted={muted} />
        </span>
        <span className="hidden text-sm lg:block">
          <Movement value={p.movement} />
        </span>
        <span className="hidden truncate text-sm text-foreground lg:block" title={p.strongest ?? undefined}>
          {p.strongest ?? <span className="text-muted-2">—</span>}
        </span>
        <span className="hidden truncate text-sm text-foreground lg:block" title={p.weakest ?? undefined}>
          {p.weakest ?? <span className="text-muted-2">—</span>}
        </span>
        <span className="hidden text-sm text-muted lg:block">{p.sampleNote.split(" · ")[0]}</span>
        <ChevronDown aria-label="Show breakdown" className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <Breakdown p={p} period={period} />
    </details>
  );
}

function Section({
  title,
  hint,
  list,
  period,
  showPosition,
}: {
  title: string;
  hint?: string;
  list: PlayerRating[];
  period: RankingPeriod;
  showPosition: boolean;
}) {
  if (list.length === 0) return null;
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 border-b border-border bg-surface-raised/60 px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
        {hint && <p className="text-xs text-muted-2">{hint}</p>}
      </div>
      {list.map((p) => (
        <Row key={p.playerId} p={p} period={period} showPosition={showPosition} />
      ))}
    </div>
  );
}

export function Leaderboard({ players, period, group }: { players: PlayerRating[]; period: RankingPeriod; group: "skaters" | "goalies" }) {
  const ranked = players.filter((p) => p.status === "ranked");
  const provisional = players.filter((p) => p.status === "provisional");
  const unrated = players.filter((p) => p.status === "unrated");
  const showPosition = group === "skaters";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="hidden grid-cols-[3rem_minmax(0,1.6fr)_2.5rem_9rem_3rem_minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem_1.25rem] gap-x-3 border-b border-border bg-surface-raised px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted lg:grid">
        <span>Rank</span>
        <span>Player</span>
        <span>Pos</span>
        <span>Rating / 100</span>
        <span>Move</span>
        <span>Strongest</span>
        <span>Needs work</span>
        <span>Sample</span>
        <span />
      </div>
      <Section title="Ranked" list={ranked} period={period} showPosition={showPosition} />
      <Section title="Provisional" hint="— shown with a rating, but not enough evidence yet for a fair rank" list={provisional} period={period} showPosition={showPosition} />
      <Section title="Not yet rated" hint="— no relevant stats recorded in this period" list={unrated} period={period} showPosition={showPosition} />
    </div>
  );
}
