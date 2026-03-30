"use client";

import * as React from "react";
import { Select } from "@/components/ui";

export function SelectField({
  label,
  required = true,
  ...props
}: React.ComponentProps<typeof Select> & { label: string; required?: boolean }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#0F172A]">
        {label}
        {!required ? <span className="ml-1 text-[#64748B]">(optional)</span> : null}
      </span>
      <Select {...props} />
    </label>
  );
}
