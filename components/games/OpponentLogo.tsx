import Image from "next/image";
import { getOpponentLogo } from "@/lib/opponent-logos";
import { initials } from "@/components/dashboard/dashboardCardStyles";
import { cn } from "@/lib/cn";

/**
 * Real opponent logo when one has been supplied for that team (see
 * lib/opponent-logos.ts), otherwise the same text-monogram placeholder
 * already used everywhere else in the app. Used by Next Game, Last Game,
 * and the Games schedule so every opponent avatar resolves identically.
 */
export function OpponentLogo({ opponent, className }: { opponent: string; className?: string }) {
  const logo = getOpponentLogo(opponent);

  return (
    <div
      className={cn(
        "relative rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0 overflow-hidden",
        className
      )}
    >
      {logo ? (
        <Image src={logo} alt="" fill className="object-contain p-1.5" />
      ) : (
        <span className="text-sm font-bold text-muted">{initials(opponent)}</span>
      )}
    </div>
  );
}
