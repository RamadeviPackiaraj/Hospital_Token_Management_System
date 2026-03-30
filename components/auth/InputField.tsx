"use client";

import * as React from "react";
import { Input } from "@/components/ui";

export function InputField({
  label,
  required = true,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; required?: boolean }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#0F172A]">
        {label}
        {!required ? <span className="ml-1 text-[#64748B]">(optional)</span> : null}
      </span>
      <Input inputSize="md" {...props} />
    </label>
  );
}
