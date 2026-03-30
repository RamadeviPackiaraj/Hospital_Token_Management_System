"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function RoleCard({
  selected = false,
  icon,
  title,
  onClick
}: {
  selected?: boolean;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring flex h-[76px] w-full items-center gap-4 rounded-xl border px-4 text-left transition",
        selected ? "border-[#0EA5A4] bg-[#F0FDFA]" : "border-[#E2E8F0] bg-white hover:border-[#94A3B8]"
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-lg border",
          selected ? "border-[#99F6E4] bg-white text-[#0EA5A4]" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
        )}
      >
        {icon}
      </span>
      <span className="text-base font-medium text-[#0F172A]">{title}</span>
    </button>
  );
}
