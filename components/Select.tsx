"use client";

import * as React from "react";
import { FormField } from "@/components/forms";
import { Select as BaseSelect, type SelectOption, type SelectProps as BaseSelectProps } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export interface SelectProps extends BaseSelectProps {
  label: string;
  error?: string;
  hint?: string;
  success?: boolean;
  containerClassName?: string;
}

export { type SelectOption };

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, error, hint, success = false, required = true, className, containerClassName, ...props },
  ref
) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const hasError = Boolean(error);

  return (
    <FormField
      label={label}
      htmlFor={selectId}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <BaseSelect
        id={selectId}
        ref={ref}
        aria-invalid={hasError}
        className={cn(
          hasError &&
            "border-[#EF4444] text-[#0F172A] hover:border-[#EF4444] focus-visible:ring-[#EF4444]",
          !hasError &&
            success &&
            "border-[#22C55E] text-[#0F172A] hover:border-[#22C55E] focus-visible:ring-[#22C55E]",
          className
        )}
        required={required}
        {...props}
      />
    </FormField>
  );
});
