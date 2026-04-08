"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/scheduling/Card";

export interface HighlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  tone?: "primary" | "neutral";
  icon?: React.ReactNode;
}

export const HighlightCard = React.forwardRef<HTMLDivElement, HighlightCardProps>(function HighlightCard(
  { className, title, description, tone = "neutral", icon, children, ...props },
  ref
) {
  return (
    <Card
      ref={ref}
      className={cn(
        tone === "primary" && "border-[#0EA5A4] bg-[#F0FDFA]",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#0EA5A4]">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="ui-card-title">{title}</h3>
          {description ? <p className="mt-1 ui-card-meta">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
});
