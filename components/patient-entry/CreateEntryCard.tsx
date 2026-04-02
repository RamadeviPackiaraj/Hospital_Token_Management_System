"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateEntryCardProps {
  active?: boolean;
  onClick: () => void;
}

export function CreateEntryCard({ active = false, onClick }: CreateEntryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring w-full rounded-lg border border-dashed border-[#E2E8F0] bg-[#FFFFFF] p-4 text-left transition hover:border-[#0EA5A4]",
        active && "border-[#0EA5A4]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0EA5A4]">
          <Plus className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="ui-section-title">+ New Patient Entry</p>
          <p className="mt-1 ui-body-secondary">Create a patient token from today&apos;s available schedules.</p>
        </div>
      </div>
    </button>
  );
}
