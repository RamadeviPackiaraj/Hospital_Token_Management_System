"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "focus-ring min-h-28 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] transition hover:border-[#0EA5A4]",
        className
      )}
      {...props}
    />
  );
});
