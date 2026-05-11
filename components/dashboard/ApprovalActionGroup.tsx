"use client";

import { Check, Pencil, Power, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { UserApprovalStatus } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

const approvalButtonClassName =
  "min-w-[7.75rem] justify-center rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-px disabled:translate-y-0";

const iconButtonClassName =
  "rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-[#0EA5A4]";

const editButtonClassName =
  "border-[#99F6E4] bg-[#F0FDFA] !text-[#0EA5A4] hover:border-[#0EA5A4] hover:bg-[#CCFBF1] hover:!text-[#0EA5A4] [&_svg]:text-[#0EA5A4]";

const deleteButtonClassName =
  "border-[#FECACA] bg-[#FEF2F2] !text-[#EF4444] hover:border-[#EF4444] hover:bg-[#FEE2E2] hover:!text-[#EF4444] [&_svg]:text-[#EF4444]";

export function ApprovalActionGroup({
  status,
  approveLabel,
  rejectLabel,
  editLabel,
  reviewLabel = "Review",
  deactivateLabel = "Deactivate",
  deleteLabel,
  itemName,
  busy = false,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: {
  status: UserApprovalStatus;
  approveLabel: string;
  rejectLabel: string;
  editLabel: string;
  reviewLabel?: string;
  deactivateLabel?: string;
  deleteLabel: string;
  itemName: string;
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (status === "approved") {
    return (
      <div className="flex min-w-[19rem] flex-nowrap items-center gap-2 whitespace-nowrap">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Pencil className="size-4" />}
          onClick={onEdit}
          aria-label={`${editLabel} ${itemName}`}
          title={editLabel}
          className={cn(iconButtonClassName, editButtonClassName)}
        />
        <Button
          variant="dangerOutline"
          size="sm"
          leftIcon={<Power className="size-4" />}
          disabled={busy}
          onClick={onReject}
          className={cn(approvalButtonClassName, busy && "shadow-none")}
        >
          {deactivateLabel}
        </Button>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex min-w-[19rem] flex-nowrap items-center gap-2 whitespace-nowrap">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Pencil className="size-4" />}
          onClick={onEdit}
          aria-label={`${reviewLabel} ${itemName}`}
          title={reviewLabel}
          className={cn(iconButtonClassName, editButtonClassName)}
        />
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="size-4" />}
          onClick={onDelete}
          aria-label={`${deleteLabel} ${itemName}`}
          title={deleteLabel}
          className={cn(iconButtonClassName, deleteButtonClassName)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-[19rem] flex-nowrap items-center gap-2 whitespace-nowrap">
      <Button
        variant="successOutline"
        size="sm"
        leftIcon={<Check className="size-4" />}
        disabled={busy}
        onClick={onApprove}
        className={cn(approvalButtonClassName, busy && "shadow-none")}
      >
        {approveLabel}
      </Button>
      <Button
        variant="dangerOutline"
        size="sm"
        leftIcon={<X className="size-4" />}
        disabled={busy}
        onClick={onReject}
        className={cn(approvalButtonClassName, busy && "shadow-none")}
      >
        {rejectLabel}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Pencil className="size-4" />}
        onClick={onEdit}
        aria-label={`${editLabel} ${itemName}`}
        title={editLabel}
        className={cn(iconButtonClassName, editButtonClassName)}
      />
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Trash2 className="size-4" />}
        onClick={onDelete}
        aria-label={`${deleteLabel} ${itemName}`}
        title={deleteLabel}
        className={cn(iconButtonClassName, deleteButtonClassName)}
      />
    </div>
  );
}
