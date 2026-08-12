import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const tones = {
  neutral: "bg-surface-raised text-muted border-border",
  positive: "bg-positive-bg text-positive border-positive/30",
  negative: "bg-negative-bg text-negative border-negative/30",
  warning: "bg-warning-bg text-warning border-warning/30",
  accent: "bg-accent/10 text-accent-strong border-accent/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "ACTIVE" | "INJURED" | "UNAVAILABLE" }) {
  const map = {
    ACTIVE: { tone: "positive" as const, label: "Active" },
    INJURED: { tone: "negative" as const, label: "Injured" },
    UNAVAILABLE: { tone: "warning" as const, label: "Unavailable" },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function TrendBadge({ value, digits = 1 }: { value: number | null; digits?: number }) {
  if (value === null || Number.isNaN(value)) return <Badge tone="neutral">—</Badge>;
  const tone = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
  const arrow = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  const sign = value > 0 ? "+" : "";
  return (
    <Badge tone={tone}>
      {arrow} {sign}
      {value.toFixed(digits)}%
    </Badge>
  );
}
