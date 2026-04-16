import { cn } from "@/lib/utils";
import type * as React from "react";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {}

export function TVLabel({ className, ...props }: TypographyProps) {
  return <p className={cn("tv-label", className)} {...props} />;
}

export function TVSectionTitle({ className, ...props }: TypographyProps) {
  return <p className={cn("tv-section-title", className)} {...props} />;
}

export function TVBody({ className, ...props }: TypographyProps) {
  return <p className={cn("tv-body", className)} {...props} />;
}

export function TVBodySecondary({ className, ...props }: TypographyProps) {
  return <p className={cn("tv-body-secondary", className)} {...props} />;
}
