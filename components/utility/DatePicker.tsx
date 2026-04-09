"use client";

import * as React from "react";
import ReactDatePicker from "react-datepicker";
import { CalendarDays } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLElement>;
}

function parseDateValue(value?: string) {
  if (!value) return null;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : null;
}

export function DatePicker({
  value,
  defaultValue,
  onChange,
  onBlur,
  className,
  placeholder = "dd/mm/yyyy",
  min,
  max,
  disabled,
  id,
  name,
  required,
  ...props
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    () => parseDateValue(value ?? defaultValue)
  );

  React.useEffect(() => {
    if (value === undefined) return;
    setSelectedDate(parseDateValue(value));
  }, [value]);

  return (
        <div className="relative">
      <ReactDatePicker
        selected={selectedDate ?? undefined}
        onChange={(date: Date | null) => {
          setSelectedDate(date);
          onChange?.(date ? format(date, "yyyy-MM-dd") : "");
        }}
        onBlur={onBlur}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        disabled={disabled}
        minDate={parseDateValue(min) ?? undefined}
        maxDate={parseDateValue(max) ?? undefined}
        id={id}
        name={name}
        required={required}
        className={cn(
          "focus-ring w-full rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] py-2 pl-3 pr-11 text-sm text-[#0F172A] placeholder:text-[#64748B] transition hover:border-[#0EA5A4]",
          className
        )}
        calendarClassName="!border-0"
        autoComplete="off"
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
    </div>
  );
}
