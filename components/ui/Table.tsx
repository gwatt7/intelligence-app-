import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-muted">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn("bg-surface", onClick && "cursor-pointer hover:bg-surface-raised", className)}
    >
      {children}
    </tr>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2.5 font-medium whitespace-nowrap", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 whitespace-nowrap", className)}>{children}</td>;
}
