"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export function Radio({ className, label, description, id, ...props }: RadioProps) {
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;

  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-start gap-3 rounded-xl p-1 text-sm text-slate-700"
    >
      <input
        id={inputId}
        type="radio"
        className={cn(
          "focus-ring mt-0.5 h-4 w-4 border-slate-300 text-brand-600",
          className
        )}
        {...props}
      />
      <span className="space-y-1">
        {label ? <span className="block font-medium text-slate-900">{label}</span> : null}
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}
