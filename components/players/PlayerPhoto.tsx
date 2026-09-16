import Image from "next/image";
import { cn } from "@/lib/cn";

export function PersonSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.6-9.8 4.9v2.7h19.6v-2.7c0-3.3-6.5-4.9-9.8-4.9z" />
    </svg>
  );
}

const SIZE_CLASSES = {
  sm: "h-20 w-20",
  md: "h-36 w-36 sm:h-44 sm:w-44",
  lg: "h-40 w-40 sm:h-52 sm:w-52",
} as const;

/**
 * Read-only headshot display — a real uploaded photo, or a blank
 * person-silhouette placeholder (never a stock photo), with the real UWS
 * logo (public/uws-logo.png) subtly watermarked behind it.
 *
 * "boxed": a dark accent-gradient panel behind the photo, for cards sitting
 * on the app's normal dark background (the Players grid). "flat": no
 * separate background fill of its own — just a thin outline — for use
 * directly on the light Player Profile card, where a second boxed panel
 * isn't wanted.
 */
export function PlayerPhoto({
  photoUrl,
  size = "md",
  variant = "boxed",
  className,
}: {
  photoUrl: string | null;
  size?: keyof typeof SIZE_CLASSES;
  variant?: "boxed" | "flat";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden flex items-center justify-center shrink-0",
        SIZE_CLASSES[size],
        variant === "boxed"
          ? "border border-border bg-gradient-to-br from-accent/[0.10] via-surface-raised to-surface-raised"
          : "border border-black/10",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          variant === "boxed" ? "opacity-[0.14]" : "opacity-[0.08]"
        )}
      >
        <Image src="/uws-logo.png" alt="" width={110} height={110} className="object-contain" />
      </div>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data: URI, not an optimizable remote/local asset
        <img src={photoUrl} alt="" className="relative h-full w-full object-cover" />
      ) : (
        <PersonSilhouette
          className={cn("relative h-16 w-16", variant === "boxed" ? "text-muted-2" : "text-black/25")}
        />
      )}
    </div>
  );
}

/**
 * Real player photo (or the same blank silhouette used everywhere else) as
 * a portrait cutout — no bounding box or background panel, center-anchored
 * so the subject stays in frame regardless of the source photo's own
 * proportions (a tight portrait headshot or a wide action shot alike),
 * fading to transparent toward the bottom so it blends into the card
 * rather than ending in a hard rectangular edge. For cards where a single
 * player is the visual hero (e.g. Mini Games' Top Progressing / Trending
 * Down spotlight cards).
 */
export function PlayerCutout({ photoUrl, className }: { photoUrl: string | null; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        maskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
      }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data: URI, not an optimizable remote/local asset
        <img src={photoUrl} alt="" className="h-full w-full object-cover object-center" />
      ) : (
        <div className="h-full w-full flex items-start justify-center pt-3">
          <PersonSilhouette className="h-[60%] w-[60%] text-muted-2/70" />
        </div>
      )}
    </div>
  );
}
