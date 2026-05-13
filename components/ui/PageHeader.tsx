"use client";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon,
  meta,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="ui-page-title">{title}</h2>
            {description ? <p className="mt-1 ui-body-secondary">{description}</p> : null}
          </div>
        </div>
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
