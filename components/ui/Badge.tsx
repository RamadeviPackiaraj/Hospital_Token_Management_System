import * as React from "react";
import { badgeVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

export type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  status?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant, status, className }: BadgeProps) {
  const tone = variant ?? status ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        badgeVariants[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
