"use client";

import { Card } from "@/components/ui/Card";

export function EmptyState({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-6 text-center ${className || ""}`}>
      {icon ? (
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#94A3B8]">
          {icon}
        </div>
      ) : null}
      <p className="mt-3 ui-section-title">{title}</p>
      {description ? <p className="mt-1 ui-body-secondary">{description}</p> : null}
    </Card>
  );
}
