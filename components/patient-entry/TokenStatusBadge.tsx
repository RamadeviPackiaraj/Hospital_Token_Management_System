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
    tone: "neutral" | "warning" | "success" | "error";
  }
> = {
  WAITING: {
    label: "Waiting",
    tone: "neutral",
  },
  CALLED: {
    label: "Called",
    tone: "warning",
  },
  IN_PROGRESS: {
    label: "In Progress",
    tone: "warning",
  },
  COMPLETED: {
    label: "Completed",
    tone: "success",
  },
  NO_SHOW: {
    label: "No show",
    tone: "error",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "error",
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
