"use client";

import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotPreviewProps {
  slots: string[];
  emptyLabel?: string;
  className?: string;
}

export function SlotPreview({
  slots,
  emptyLabel = "Select date and time",
  className,
}: SlotPreviewProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {slots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white text-[#0EA5A4]">
              <Clock3 className="size-5" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-base font-medium text-[#0F172A]">No Preview Yet</p>
              <p className="text-sm text-[#64748B]">{emptyLabel}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            {slots.map((slot) => (
              <div
                key={slot}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-center text-sm text-[#0F172A]"
              >
                {slot}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#64748B]">{slots.length} slots ready to save</p>
        </>
      )}
    </div>
  );
}
