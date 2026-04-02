"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export function Checkbox({ className, label, description, id, ...props }: CheckboxProps) {
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;

  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm text-[#0F172A]"
    >
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          "focus-ring mt-0.5 h-4 w-4 rounded border-[#E2E8F0] text-[#0EA5A4]",
          className
        )}
        {...props}
      />
      <span className="space-y-1">
        {label ? <span className="block text-sm font-medium text-[#0F172A]">{label}</span> : null}
        {description ? <span className="block text-xs text-[#64748B]">{description}</span> : null}
      </span>
    </label>
  );
}
