"use client";

import { Plus } from "lucide-react";
import { SectionTitle, BodySecondary } from "@/components/ui/Typography";
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
        "focus-ring w-full rounded-lg border border-dashed border-[#E2E8F0] bg-[#FFFFFF] p-4 transition duration-300 ease-in-out hover:border-[#0EA5A4] hover:shadow-md",
        active && "border-[#0EA5A4] bg-[#F0FDFA]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0EA5A4] transition group-hover:border-[#0EA5A4]">
          <Plus className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-left">
          <SectionTitle className="text-[16px]">+ New Patient Entry</SectionTitle>
          <BodySecondary className="mt-1 text-[14px]">Create a patient token from today&apos;s available schedules.</BodySecondary>
        </div>
      </div>
    </button>
  );
}
