"use client";

import * as React from "react";
import { Input, InputProps } from "@/components/ui/Input";

export interface DatePickerProps extends Omit<InputProps, "type"> {}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  props,
  ref
) {
  return <Input ref={ref} type="date" {...props} />;
});
