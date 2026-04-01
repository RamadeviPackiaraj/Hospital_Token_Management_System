"use client";

import * as React from "react";
import ReactTimePicker from "react-time-picker";
import { FormField } from "@/components/forms/FormField";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  step?: number;
  onBlur?: () => void;
  label: string;
  error?: string;
  hint?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
  { label, error, hint, required, id, name, value, defaultValue, onChange, onBlur, className, disabled, step: _step },
  _
) {
  const [selectedTime, setSelectedTime] = React.useState<string | null>(value ?? defaultValue ?? null);

  React.useEffect(() => {
    if (value === undefined) return;
    setSelectedTime(value || null);
  }, [value]);

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <div className="relative">
        <ReactTimePicker
          value={selectedTime}
          onChange={(nextValue) => {
            const normalized = typeof nextValue === "string" ? nextValue : "";
            setSelectedTime(normalized || null);
            onChange?.(normalized);
          }}
          format="HH:mm"
          clearIcon={null}
          className={cn("time-picker-field", className)}
          disabled={disabled}
          id={id}
          name={name}
          onBlur={onBlur}
          maxDetail="minute"
          hourPlaceholder="hh"
          minutePlaceholder="mm"
          nativeInputAriaLabel={label}
          disableClock
        />
        <Clock3 className="pointer-events-none absolute right-11 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
      </div>
    </FormField>
  );
});
