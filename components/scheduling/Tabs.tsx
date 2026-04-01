"use client";

import { cn } from "@/lib/utils";

export interface TabOption {
  label: string;
  value: string;
}

interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ options, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Doctor schedule sections"
      className={cn("flex flex-wrap gap-2 rounded-lg border border-[#E2E8F0] bg-white p-2", className)}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-lg px-4 py-2 text-sm transition",
              active
                ? "bg-[#0EA5A4] font-medium text-white"
                : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
