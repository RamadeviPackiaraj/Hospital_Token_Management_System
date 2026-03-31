"use client";

import * as React from "react";
import { FormField } from "@/components/forms";
import { Input as BaseInput, type InputProps as BaseInputProps } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface InputProps extends BaseInputProps {
  label: string;
  error?: string;
  hint?: string;
  success?: boolean;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, hint, success = false, required = true, className, containerClassName, ...props },
  ref
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hasError = Boolean(error);

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <BaseInput
        id={inputId}
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
