"use client";

import { CalendarDays, Clock3, Stethoscope, Ticket, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardBody, CardTitle, Label } from "@/components/ui/Typography";
import { formatScheduleDate, formatTimeTo12Hour } from "@/lib/scheduling";
import type { PatientTokenRecord, PatientTokenStatus } from "@/lib/scheduling-types";
import { cn } from "@/lib/utils";

interface TokenCardProps {
  token: PatientTokenRecord;
  isUpdating?: boolean;
  onStatusChange: (tokenId: string, status: PatientTokenStatus) => void | Promise<void>;
}

function getCardStyles(status: PatientTokenStatus) {
  switch (status) {
    case "CALLING":
      return {
        card: "border-[#22C55E] bg-[linear-gradient(180deg,#F0FDF4_0%,#FFFFFF_100%)]",
        line: "bg-[#22C55E]",
        tokenShell: "border-[#86EFAC] bg-[#DCFCE7]",
        tokenCore: "border-[#22C55E] bg-[#FFFFFF] text-[#15803D]",
        icon: "text-[#16A34A]",
        badgeTone: "success" as const,
        badgeClass: "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]",
        departmentClass: "border-[#86EFAC] bg-[#FFFFFF] text-[#15803D]",
        metaCard: "border-[#BBF7D0] bg-[#FFFFFF]",
        buttonClass: "border-[#22C55E]",
        divider: "border-[#BBF7D0]",
        glow: "bg-[#DCFCE7]",
      };
    case "COMPLETED":
      return {
        card: "border-[#EF4444] bg-[linear-gradient(180deg,#FEF2F2_0%,#FFFFFF_100%)]",
        line: "bg-[#EF4444]",
        tokenShell: "border-[#FCA5A5] bg-[#FEE2E2]",
        tokenCore: "border-[#EF4444] bg-[#FFFFFF] text-[#DC2626]",
        icon: "text-[#DC2626]",
        badgeTone: "error" as const,
        badgeClass: "border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626]",
        departmentClass: "border-[#FCA5A5] bg-[#FFFFFF] text-[#DC2626]",
        metaCard: "border-[#FECACA] bg-[#FFFFFF]",
        buttonClass: "border-[#FCA5A5]",
        divider: "border-[#FECACA]",
        glow: "bg-[#FEE2E2]",
      };
    case "NOT_STARTED":
    default:
      return {
        card: "border-[#0EA5A4] bg-[linear-gradient(180deg,#F0FDFA_0%,#FFFFFF_100%)]",
        line: "bg-[#0EA5A4]",
        tokenShell: "border-[#99F6E4] bg-[#F0FDFA]",
        tokenCore: "border-[#0EA5A4] bg-[#FFFFFF] text-[#0EA5A4]",
        icon: "text-[#0EA5A4]",
        badgeTone: "info" as const,
        badgeClass: "border-[#99F6E4] bg-[#F0FDFA] text-[#0EA5A4]",
        departmentClass: "border-[#99F6E4] bg-[#FFFFFF] text-[#0EA5A4]",
        metaCard: "border-[#CCFBF1] bg-[#FFFFFF]",
        buttonClass: "border-[#99F6E4]",
        divider: "border-[#CCFBF1]",
        glow: "bg-[#CCFBF1]",
      };
  }
}

function getStatusLabel(status: PatientTokenStatus) {
  if (status === "CALLING") return "Calling";
  if (status === "COMPLETED") return "Completed";
  return "Pending";
}

export function TokenCard({
  token,
  isUpdating = false,
  onStatusChange,
}: TokenCardProps) {
  const styles = getCardStyles(token.status);

  return (
    <article className={cn("group relative overflow-hidden rounded-[14px] border shadow-panel transition-transform duration-200 hover:-translate-y-1", styles.card)}>
      <div className={cn("h-1.5 w-full", styles.line)} aria-hidden="true" />
      <div className={cn("pointer-events-none absolute -right-8 top-8 h-24 w-24 rounded-full opacity-60 blur-2xl", styles.glow)} aria-hidden="true" />

      <div className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border", styles.tokenShell)}>
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border", styles.tokenCore)}>
              <span className="ui-section-title leading-none">{token.tokenNumber}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserRound className={cn("h-4 w-4", styles.icon)} />
                  <CardTitle className="truncate">{token.patientName}</CardTitle>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Stethoscope className={cn("h-4 w-4", styles.icon)} />
                  <CardBody className="truncate text-[#64748B]">Dr. {token.doctorName}</CardBody>
                </div>
              </div>

              <Badge
                status={styles.badgeTone}
                className={cn("shrink-0 rounded-lg border px-3 py-1 ui-meta", styles.badgeClass)}
              >
                {getStatusLabel(token.status)}
              </Badge>
            </div>

            <div className={cn("inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 ui-meta", styles.departmentClass)}>
              <Ticket className={cn("h-4 w-4", styles.icon)} />
              {token.department}
            </div>
          </div>
        </div>

        <div className={cn("border-t", styles.divider)} />

        <div className="grid grid-cols-2 gap-3">
          <div className={cn("rounded-[10px] border p-4", styles.metaCard)}>
            <div className="flex items-start gap-2">
              <CalendarDays className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
              <div className="min-w-0">
                <Label>Date</Label>
                <CardBody className="mt-1">{formatScheduleDate(token.date)}</CardBody>
              </div>
            </div>
          </div>

          <div className={cn("rounded-[10px] border p-4", styles.metaCard)}>
            <div className="flex items-start gap-2">
              <Clock3 className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
              <div className="min-w-0">
                <Label>Time</Label>
                <CardBody className="mt-1">{formatTimeTo12Hour(token.time)}</CardBody>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {token.status === "NOT_STARTED" ? (
            <Button
              size="sm"
              onClick={() => void onStatusChange(token.id, "CALLING")}
              loading={isUpdating}
              className={cn("flex-1 rounded-[10px] border", styles.buttonClass)}
            >
              Call Patient
            </Button>
          ) : null}

          {token.status === "CALLING" ? (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => void onStatusChange(token.id, "COMPLETED")}
                loading={isUpdating}
                className={cn("flex-1 rounded-[10px] border border-[#22C55E]")}
              >
                End Call
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void onStatusChange(token.id, "NOT_STARTED")}
                loading={isUpdating}
                className={cn("flex-1 rounded-[10px] border bg-[#FFFFFF]", styles.buttonClass)}
              >
                Reset
              </Button>
            </>
          ) : null}

          {token.status === "COMPLETED" ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void onStatusChange(token.id, "NOT_STARTED")}
              loading={isUpdating}
              className={cn("flex-1 rounded-[10px] border bg-[#FFFFFF]", styles.buttonClass)}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
