import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants = {
  primary: "bg-accent text-accent-contrast font-semibold hover:bg-accent-strong px-4 py-2",
  secondary: "bg-surface-raised border border-border text-foreground hover:border-muted-2 px-4 py-2",
  ghost: "text-muted hover:text-foreground px-3 py-1.5",
  danger: "bg-negative-bg text-negative border border-negative/30 hover:bg-negative/20 px-4 py-2",
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  variant = "primary",
  href,
}: {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  href: string;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
