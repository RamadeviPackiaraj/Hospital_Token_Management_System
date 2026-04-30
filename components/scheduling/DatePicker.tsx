"use client";

import * as React from "react";
import { FormField } from "@/components/forms/FormField";
import { cn } from "@/lib/utils";
import {
  DatePicker as BaseDatePicker,
  type DatePickerProps as BaseDatePickerProps,
} from "@/components/utility/DatePicker";

export interface DatePickerProps extends BaseDatePickerProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  success?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, error, hint, required, success = false, id, className, ...props },
  _
) {
  const hasError = Boolean(error);

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <BaseDatePicker
        id={id}
        className={cn(
          hasError && "border-[#EF4444] text-[#0F172A] hover:border-[#EF4444] focus-visible:ring-[#EF4444]",
          !hasError && success && "border-[#22C55E] text-[#0F172A] hover:border-[#22C55E] focus-visible:ring-[#22C55E]",
          className
        )}
        {...props}
      />
    </FormField>
  );
});
