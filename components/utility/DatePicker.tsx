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
          "focus-ring min-h-11 w-full rounded-[16px] border border-[#D7E2EE] bg-[#FFFFFF] px-4 py-3 pr-12 text-[15px] text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-[#94A3B8] transition hover:border-[#0EA5A4]",
          className
        )}
        calendarClassName="!border-0"
        popperClassName="react-datepicker-site-popper"
        popperPlacement="bottom-start"
        showPopperArrow={false}
        autoComplete="off"
      />
      <CalendarDays className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
    </div>
  );
}
