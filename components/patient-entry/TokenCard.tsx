"use client";

import { CalendarDays, Clock3 } from "lucide-react";
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
        card: "border-[#BBF7D0] bg-[#FFFFFF]",
        topLine: "bg-[#22C55E]",
        halo: "bg-[#DCFCE7]",
        ring: "border-[#22C55E]",
        tokenCore: "border-[#22C55E] bg-[#F0FDF4] text-[#15803D]",
        badgeTone: "success" as const,
        badgeClass: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
        deptClass: "bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]",
      };
    case "COMPLETED":
      return {
        card: "border-[#FECACA] bg-[#FFFFFF]",
        topLine: "bg-[#EF4444]",
        halo: "bg-[#FEE2E2]",
        ring: "border-[#EF4444]",
        tokenCore: "border-[#EF4444] bg-[#FEF2F2] text-[#DC2626]",
        badgeTone: "error" as const,
        badgeClass: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]",
        deptClass: "bg-[#FFF5F5] text-[#DC2626] ring-[#FECACA]",
      };
    case "NOT_STARTED":
    default:
      return {
        card: "border-[#CBD5E1] bg-[#FFFFFF]",
        topLine: "bg-[#0EA5A4]",
        halo: "bg-[#F0FDFA]",
        ring: "border-[#CBD5E1]",
        tokenCore: "border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A]",
        badgeTone: "info" as const,
        badgeClass: "bg-[#F0FDFA] text-[#0EA5A4] ring-[#99F6E4]",
        deptClass: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
      };
  }
}

export function TokenCard({
  token,
  isUpdating = false,
  onStatusChange,
}: TokenCardProps) {
  const styles = getCardStyles(token.status);
  const isCalling = token.status === "CALLING";

  return (
    <article
      className={cn("relative overflow-hidden rounded-2xl border bg-[#FFFFFF] shadow-panel transition-all duration-200", styles.card)}
    >
      <div className={cn("h-1.5 w-full", styles.topLine)} aria-hidden="true" />
      <div className={cn("absolute right-[-32px] top-10 h-28 w-28 rounded-full opacity-80 blur-3xl", styles.halo)} aria-hidden="true" />
      <div className={cn("absolute left-10 top-16 h-16 w-16 rounded-full opacity-50 blur-2xl", styles.halo)} aria-hidden="true" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div
                className={cn(
                  "absolute inset-0 rounded-full border-2 border-dashed opacity-80",
                  styles.ring,
                  isCalling ? "animate-spin" : ""
                )}
                style={isCalling ? { animationDuration: "7s" } : undefined}
                aria-hidden="true"
              />
              <div
                className={cn(
                  "absolute inset-[6px] rounded-full border opacity-50",
                  styles.ring,
                  isCalling ? "animate-pulse" : ""
                )}
                aria-hidden="true"
              />
              {isCalling ? (
                <div className="absolute inset-[-6px] rounded-full border border-[#22C55E]/20 animate-ping" aria-hidden="true" />
              ) : null}
              <div
                className={cn("relative flex h-12 w-12 items-center justify-center rounded-full border", styles.tokenCore)}
                role="img"
                aria-label={`Token ${token.tokenNumber}`}
              >
                <span className="text-[18px] font-medium leading-none">{token.tokenNumber}</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate">{token.patientName}</CardTitle>
                <CardBody className="mt-1 truncate text-[#64748B]">Dr. {token.doctorName}</CardBody>
              </div>

              <Badge status={styles.badgeTone} className={cn("shrink-0 rounded-full px-3 py-1 text-[12px]", styles.badgeClass)}>
                {token.status === "NOT_STARTED" ? "Pending" : token.status === "CALLING" ? "Calling" : "Completed"}
              </Badge>
            </div>

            <Badge status="neutral" className={cn("rounded-full px-3 py-1 text-[12px]", styles.deptClass)}>
              {token.department}
            </Badge>
          </div>
        </div>

        <div className="my-5 ui-card-divider" />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0EA5A4]" />
              <div className="min-w-0">
                <Label>Date</Label>
                <CardBody className="mt-1">{formatScheduleDate(token.date)}</CardBody>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#0EA5A4]" />
              <div className="min-w-0">
                <Label>Time</Label>
                <CardBody className="mt-1">{formatTimeTo12Hour(token.time)}</CardBody>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {token.status === "NOT_STARTED" ? (
            <Button
              size="sm"
              onClick={() => void onStatusChange(token.id, "CALLING")}
              loading={isUpdating}
              className="flex-1 rounded-xl"
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
                className="flex-1 rounded-xl"
              >
                End Call
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void onStatusChange(token.id, "NOT_STARTED")}
                loading={isUpdating}
                className="flex-1 rounded-xl border border-[#CBD5E1] bg-white"
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
              className="flex-1 rounded-xl border border-[#CBD5E1] bg-white"
            >
              Reset
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
