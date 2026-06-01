"use client";

import { Badge } from "@/components/ui/Badge";
import type { PatientTokenStatus } from "@/lib/scheduling-types";

interface TokenStatusBadgeProps {
  status: PatientTokenStatus;
}

const statusConfig: Record<
  PatientTokenStatus,
  {
    label: string;
    tone: "neutral" | "warning" | "success";
  }
> = {
  NOT_STARTED: {
    label: "Not Started",
    tone: "neutral",
  },
  CALLING: {
    label: "In Progress",
    tone: "warning",
  },
  COMPLETED: {
    label: "Completed",
    tone: "success",
  },
};

export function TokenStatusBadge({ status }: TokenStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      status={config.tone}
      className="px-2 py-1 text-xs font-medium"
    >
      {config.label}
    </Badge>
  );
}
