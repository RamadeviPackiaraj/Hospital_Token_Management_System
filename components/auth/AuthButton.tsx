"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui";
import { cn } from "@/lib/utils";

export function AuthButton({ className, size = "md", fullWidth = true, ...props }: ButtonProps) {
  return <Button size={size} fullWidth={fullWidth} className={cn("h-11", className)} {...props} />;
}
