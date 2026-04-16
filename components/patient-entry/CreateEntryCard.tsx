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
        "focus-ring w-full rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FFFFFF] p-5 shadow-panel transition-all duration-200 hover:border-[#0EA5A4] hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
        active && "border-[#0EA5A4] bg-[#F0FDFA]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0EA5A4]">
          <Plus className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-left">
          <SectionTitle>+ New Patient Entry</SectionTitle>
          <BodySecondary className="mt-1">Create a patient token from today&apos;s available schedules.</BodySecondary>
        </div>
      </div>
    </button>
  );
}
