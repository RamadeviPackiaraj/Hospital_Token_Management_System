"use client";

import { Badge } from "@/components/ui";
import type { UserApprovalStatus } from "@/lib/auth-flow";

function getBadgeTone(status: UserApprovalStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
}

export function ApprovalStatusBadge({
  status,
  approvedLabel,
  pendingLabel,
  rejectedLabel,
}: {
  status: UserApprovalStatus;
  approvedLabel: string;
  pendingLabel: string;
  rejectedLabel: string;
}) {
  const label =
    status === "approved" ? approvedLabel : status === "rejected" ? rejectedLabel : pendingLabel;

  return (
    <Badge status={getBadgeTone(status)} className="gap-1.5 px-3 py-1 font-semibold capitalize shadow-sm">
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {label}
    </Badge>
  );
}
