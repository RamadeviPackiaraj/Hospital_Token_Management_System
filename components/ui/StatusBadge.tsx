"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";

export function StatusBadge({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <Badge status={tone} className={`gap-1.5 px-2.5 py-1 ${className || ""}`}>
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" /> : null}
      {children}
    </Badge>
  );
}
