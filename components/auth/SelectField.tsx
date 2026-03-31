"use client";

import * as React from "react";
import { Select } from "@/components/Select";

export function SelectField({
  label,
  error,
  hint,
  success,
  required = true,
  ...props
}: React.ComponentProps<typeof Select>) {
  return <Select label={label} required={required} error={error} hint={hint} success={success} {...props} />;
}
