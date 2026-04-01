"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateCardProps {
  active?: boolean;
  onClick: () => void;
}

export function CreateCard({ active = false, onClick }: CreateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring w-full rounded-lg border border-dashed border-[#E2E8F0] bg-white p-4 text-left transition hover:border-[#0EA5A4]",
        active && "border-[#0EA5A4] bg-[#F0FDFA]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
          <Plus className="size-5" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium text-[#0F172A]">Create New Schedule</p>
          <p className="text-sm text-[#64748B]">Set doctor availability and generate slots.</p>
        </div>
      </div>
    </button>
  );
}
