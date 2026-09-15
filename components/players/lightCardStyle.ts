import type { CSSProperties } from "react";

/**
 * Local override for the Players section's light-gray "bubble" cards.
 * Every themed utility (bg-surface, text-foreground, text-muted,
 * border-border, plus Button/Badge/form-field colors) resolves through
 * these custom properties, so applying this as inline `style` on a card's
 * wrapper turns it light gray without forking any component. See the
 * --profile-card-* tokens in app/globals.css.
 */
export const lightCardStyle: CSSProperties = {
  ["--surface" as string]: "var(--profile-card-bg)",
  ["--surface-raised" as string]: "var(--profile-card-raised)",
  ["--border" as string]: "var(--profile-card-border)",
  ["--foreground" as string]: "var(--profile-card-fg)",
  ["--muted" as string]: "var(--profile-card-muted)",
  ["--muted-2" as string]: "var(--profile-card-muted-2)",
};
