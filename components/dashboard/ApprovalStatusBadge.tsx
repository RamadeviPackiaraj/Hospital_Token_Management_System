"use client";

import { StatusBadge } from "@/components/ui";
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
    <StatusBadge tone={getBadgeTone(status)} className="font-semibold capitalize shadow-sm">
      {label}
    </StatusBadge>
  );
}
