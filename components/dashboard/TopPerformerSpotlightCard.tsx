import Link from "next/link";
import { Users } from "lucide-react";
import { PersonSilhouette } from "@/components/players/PlayerPhoto";
import { flatPanel } from "@/components/dashboard/dashboardCardStyles";
import { cn } from "@/lib/cn";
import type { StatContribution } from "@/lib/stats";

interface SpotlightPlayer {
  playerId: string;
  name: string;
  jerseyNumber: number;
  photoUrl: string | null;
}

/**
 * The player graphic itself — a trading-card-style cutout, not a photo in a
 * frame. No circle, no box, no visible border: the image (or, lacking a
 * photo, the same blank silhouette used everywhere else in the app) is
 * masked by two nested, single-axis gradient fades — an outer one fading
 * the left edge into the card's own background, an inner one softening the
 * top and bottom edges — so its rectangular bounds disappear and it reads
 * as part of the card rather than a thumbnail sitting on top of it. Local
 * to this card on purpose: components/players/PlayerPhoto.tsx's shared
 * PlayerCutout (used elsewhere, e.g. Mini Games' progression spotlights)
 * stays exactly as it was.
 */
function TopPerformerGraphic({ photoUrl }: { photoUrl: string | null }) {
  return (
    <div
      aria-hidden
      className="absolute inset-y-0 right-0 w-[46%] sm:w-[44%] overflow-hidden"
      style={{
        maskImage: "linear-gradient(to left, black 62%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to left, black 62%, transparent 100%)",
      }}
    >
      <div
        className="h-full w-full"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 88%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 88%, transparent 100%)",
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URI, not an optimizable remote/local asset
          <img src={photoUrl} alt="" className="h-full w-full object-cover" style={{ objectPosition: "50% 20%" }} />
        ) : (
          <div className="h-full w-full flex items-end justify-center pb-0">
            <PersonSilhouette className="h-[85%] w-[85%] text-muted-2/60" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Dashboard "Top Performer" tile. Two instances are used on the Dashboard —
 * one fed Official-Game data, one fed Mini-Game data — each with its own
 * independent player selection and contributions, computed by
 * lib/player-analytics.ts and lib/mini-game-analytics.ts respectively, and
 * each still shown (distinguished by `label`) so neither ranking is lost.
 * This component has no calculation logic of its own; it only renders the
 * player and single top contribution it's given.
 */
export function TopPerformerSpotlightCard({
  label,
  player,
  contributions,
  emptyMessage,
  className,
}: {
  label: string;
  player: SpotlightPlayer | null;
  contributions: StatContribution[];
  emptyMessage: string;
  className?: string;
}) {
  const topContribution = contributions[0];

  return (
    <div className={cn(flatPanel, "p-4 sm:p-5 min-h-[170px] flex flex-col", className)}>
      {player && <TopPerformerGraphic photoUrl={player.photoUrl} />}

      <div className="relative flex items-start gap-2 mb-3 pr-[48%] sm:pr-[42%]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-[color:var(--data-teal-bg)] text-[color:var(--data-teal)]">
          <Users className="h-4 w-4" strokeWidth={2} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-2 leading-tight pt-1">{label}</p>
      </div>

      {player ? (
        <Link
          href={`/players/${player.playerId}`}
          className="relative block pr-[48%] sm:pr-[42%] hover:opacity-90 transition-opacity"
        >
          <p className="text-2xl font-extrabold text-foreground leading-none">#{player.jerseyNumber}</p>
          <p className="text-sm font-semibold text-foreground mt-1 truncate">{player.name}</p>
          {topContribution ? (
            <p className="text-xs text-positive font-mono mt-1.5">
              ↑ {topContribution.label} {(topContribution.progression.pct ?? 0).toFixed(1)}%
            </p>
          ) : (
            <p className="text-xs text-muted mt-1.5">Not enough data yet.</p>
          )}
        </Link>
      ) : (
        <p className="relative text-sm text-muted pr-[48%] sm:pr-[42%]">{emptyMessage}</p>
      )}
    </div>
  );
}
