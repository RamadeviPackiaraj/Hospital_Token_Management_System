"use client";

import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  icon,
  helper,
  className,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  helper?: string;
  className?: string;
}) {
  return (
    <Card className={`p-4 ${className || ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ui-meta">{label}</p>
          <p className="mt-2 text-[22px] font-medium leading-7 text-[#0F172A]">{value}</p>
          {helper ? <p className="mt-1 ui-meta">{helper}</p> : null}
        </div>
        {icon ? (
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
