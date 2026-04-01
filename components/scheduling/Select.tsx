"use client";

import * as React from "react";
import { FormField } from "@/components/forms/FormField";
import {
  Select as BaseSelect,
  type SelectOption,
  type SelectProps as BaseSelectProps,
} from "@/components/ui/Select";

export interface SelectProps extends Omit<BaseSelectProps, "options"> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, hint, required, id, ...props },
  ref
) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <BaseSelect ref={ref} id={id} options={options} {...props} />
    </FormField>
  );
});

export type { SelectOption };
