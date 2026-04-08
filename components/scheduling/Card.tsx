"use client";

import * as React from "react";
import { Card as BaseCard, type CardProps as BaseCardProps } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface CardProps extends BaseCardProps {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref
) {
  return <BaseCard ref={ref} className={cn(className)} {...props} />;
});
