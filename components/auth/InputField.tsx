"use client";

import * as React from "react";
import { Input } from "@/components/Input";

export function InputField({
  label,
  error,
  hint,
  success,
  required = true,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input label={label} required={required} error={error} hint={hint} success={success} inputSize="md" {...props} />;
}
