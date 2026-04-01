"use client";

import * as React from "react";
import { FormField } from "@/components/forms/FormField";
import { Input as BaseInput, type InputProps as BaseInputProps } from "@/components/ui/Input";

export interface InputProps extends BaseInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, id, ...props },
  ref
) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <BaseInput ref={ref} id={id} {...props} />
    </FormField>
  );
});
