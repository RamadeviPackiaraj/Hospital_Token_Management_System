"use client";

import * as React from "react";
import { FormField } from "@/components/forms/FormField";
import {
  DatePicker as BaseDatePicker,
  type DatePickerProps as BaseDatePickerProps,
} from "@/components/utility/DatePicker";

export interface DatePickerProps extends BaseDatePickerProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, error, hint, required, id, ...props },
  _
) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <BaseDatePicker id={id} {...props} />
    </FormField>
  );
});
