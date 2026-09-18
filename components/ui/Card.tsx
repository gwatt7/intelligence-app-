import { cn } from "@/lib/cn";
import type { CSSProperties, ReactNode } from "react";

export function Card({
  children,
  className,
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface",
        padded && "p-4 sm:p-5",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-medium text-muted mb-2", className)}>{children}</h3>
  );
}
