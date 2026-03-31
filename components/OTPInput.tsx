"use client";

import * as React from "react";
import { FormField } from "@/components/forms";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface OTPInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  success?: boolean;
  required?: boolean;
  disabled?: boolean;
  length?: number;
  seconds?: number;
  onResend?: () => Promise<void> | void;
}

export function OTPInput({
  label,
  value,
  onChange,
  error,
  hint,
  success = false,
  required = true,
  disabled = false,
  length = 6,
  seconds = 60,
  onResend,
}: OTPInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [remainingSeconds, setRemainingSeconds] = React.useState(seconds);
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    if (remainingSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  const digits = React.useMemo(() => {
    const sanitized = value.replace(/\D/g, "").slice(0, length);
    return Array.from({ length }, (_, index) => sanitized[index] ?? "");
  }, [length, value]);

  function focusIndex(index: number) {
    const nextInput = inputRefs.current[index];
    nextInput?.focus();
    nextInput?.select();
  }

  function updateDigit(index: number, digit: string) {
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    onChange(nextDigits.join(""));
  }

  async function handleResend() {
    if (!onResend || remainingSeconds > 0 || resending) {
      return;
    }

    setResending(true);

    try {
      await onResend();
      setRemainingSeconds(seconds);
    } finally {
      setResending(false);
    }
  }

  const hasError = Boolean(error);
  const isSuccess = !hasError && success;

  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      className="space-y-3"
    >
      <div className="flex gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`OTP digit ${index + 1}`}
            aria-invalid={hasError}
            className={cn(
              "focus-ring h-12 w-12 rounded-xl border bg-[#FFFFFF] text-center text-base font-semibold text-[#0F172A] transition sm:h-14 sm:w-14",
              hasError && "border-[#EF4444] hover:border-[#EF4444] focus-visible:ring-[#EF4444]",
              !hasError && isSuccess && "border-[#22C55E] hover:border-[#22C55E] focus-visible:ring-[#22C55E]",
              !hasError && !isSuccess && "border-[#E2E8F0] hover:border-[#94A3B8]",
              disabled && "cursor-not-allowed opacity-60"
            )}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, "").slice(-1);
              updateDigit(index, nextValue);

              if (nextValue && index < length - 1) {
                focusIndex(index + 1);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                updateDigit(index - 1, "");
                focusIndex(index - 1);
              }

              if (event.key === "ArrowLeft" && index > 0) {
                event.preventDefault();
                focusIndex(index - 1);
              }

              if (event.key === "ArrowRight" && index < length - 1) {
                event.preventDefault();
                focusIndex(index + 1);
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

              if (!pasted) {
                return;
              }

              onChange(pasted);
              focusIndex(Math.min(pasted.length, length) - 1);
            }}
          />
        ))}
      </div>

      {onResend ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[#64748B]">
            {remainingSeconds > 0
              ? `Resend available in ${remainingSeconds}s`
              : "You can request a new OTP now"}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={remainingSeconds > 0 || disabled}
            loading={resending}
            onClick={handleResend}
          >
            Resend OTP
          </Button>
        </div>
      ) : null}
    </FormField>
  );
}
