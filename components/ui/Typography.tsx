"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Typography heading
export const PageTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function PageTitle({ className, ...props }, ref) {
  return (
    <h1
      ref={ref}
      className={cn("text-[22px] font-medium leading-7 text-[#0F172A]", className)}
      {...props}
    />
  );
});

// Typography subheading
export const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function SectionTitle({ className, ...props }, ref) {
  return (
    <h2
      ref={ref}
      className={cn("text-[16px] font-medium leading-6 text-[#0F172A]", className)}
      {...props}
    />
  );
});

// Typography body - primary text
export const Body = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function Body({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-[14px] font-normal leading-5 text-[#0F172A]", className)}
      {...props}
    />
  );
});

// Typography body - secondary text
export const BodySecondary = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function BodySecondary({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-[14px] font-normal leading-5 text-[#64748B]", className)}
      {...props}
    />
  );
});

// Typography label/meta
export const Label = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function Label({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-[12px] font-medium leading-4 text-[#64748B]", className)}
      {...props}
    />
  );
});

// Card title - consistent with cards
export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn("text-[16px] font-medium leading-6 text-[#0F172A]", className)}
      {...props}
    />
  );
});

// Card body text
export const CardBody = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardBody({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-[14px] font-normal leading-5 text-[#0F172A]", className)}
      {...props}
    />
  );
});
