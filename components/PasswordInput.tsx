"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormField } from "@/components/forms";
import { Input as BaseInput, type InputProps as BaseInputProps } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<BaseInputProps, "type"> {
  label: string;
  error?: string;
  hint?: string;
  success?: boolean;
  containerClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { id, label, error, hint, success = false, required = true, className, containerClassName, ...props },
    ref
  ) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = React.useState(false);
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
        <div className="relative">
          <BaseInput
            id={inputId}
            ref={ref}
            type={visible ? "text" : "password"}
            aria-invalid={hasError}
            className={cn(
              "pr-11",
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
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="focus-ring absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-[#64748B] transition hover:text-[#0F172A]"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FormField>
    );
  }
);
