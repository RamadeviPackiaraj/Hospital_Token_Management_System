import * as React from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function AuthCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("w-full max-w-[520px] rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)}
      {...props}
    />
  );
}