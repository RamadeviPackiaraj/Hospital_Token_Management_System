"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: "sm" | "md" | "lg";
}

const sizeStyles: Record<NonNullable<InputProps["inputSize"]>, string> = {
  sm: "min-h-10 px-3 py-2 text-sm",
  md: "min-h-11 px-3.5 py-2.5 text-sm",
  lg: "min-h-12 px-4 py-3 text-sm"
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", inputSize = "md", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "focus-ring w-full rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-secondary)]",
        "transition hover:border-slate-300",
        sizeStyles[inputSize],
        className
      )}
      {...props}
    />
  );
});
