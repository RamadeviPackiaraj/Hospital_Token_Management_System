"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  wrapperClassName?: string;
}

export function SearchBar({ className, wrapperClassName, ...props }: SearchBarProps) {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <span
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"
        aria-hidden="true"
      >
        ⌕
      </span>
      <Input
        type="search"
        className={cn("pl-10", className)}
        aria-label={props["aria-label"] ?? "Search"}
        {...props}
      />
    </div>
  );
}
