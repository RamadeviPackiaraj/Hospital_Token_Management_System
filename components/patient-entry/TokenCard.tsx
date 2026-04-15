"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardTitle, CardBody, Label } from "@/components/ui/Typography";
import type { PatientTokenRecord, PatientTokenStatus } from "@/lib/scheduling-types";
import { formatScheduleDate, formatTimeTo12Hour } from "@/lib/scheduling";
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
        card: "border-2 border-[#0F172A] bg-gradient-to-br from-[#F0FDFA] to-[#FFFFFF] scale-[1.02] shadow-md",
        tokenBg: "bg-[#0EA5A4]",
        tokenText: "text-white",
        badge: "bg-[#DCFCE7] text-[#15803D]",
        blinkDot: true,
      };
    case "COMPLETED":
      return {
        card: "border-2 border-[#0F172A] bg-[#FFFBFB] opacity-80",
        tokenBg: "bg-[#FEA8A8]",
        tokenText: "text-white",
        badge: "bg-[#FEE2E2] text-[#DC2626]",
        blinkDot: false,
      };
    case "NOT_STARTED":
    default:
      return {
        card: "border-2 border-[#0F172A] bg-[#FFFFFF] hover:border-[#0EA5A4] hover:shadow-md",
        tokenBg: "bg-[#CBD5E1]",
        tokenText: "text-white",
        badge: "bg-[#F0FDFA] text-[#0EA5A4]",
        blinkDot: false,
      };
  }
}

export function TokenCard({
  token,
  isUpdating = false,
  onStatusChange,
}: TokenCardProps) {
  const styles = getCardStyles(token.status);
  const hasActiveToken = token.status === "CALLING";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg p-4 shadow-sm transition-all duration-300 ease-in-out",
        styles.card
      )}
    >
      {/* Header with Circular Token and Patient Info */}
      <div className="mb-4 flex items-start gap-4">
        {/* Circular Token Number */}
        <div className="relative flex-shrink-0">
          {/* Animated Ring - Only for active tokens */}
          {hasActiveToken && (
            <>
              <div
                className="absolute inset-0 rounded-full bg-[#0EA5A4] opacity-10 animate-pulse"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 rounded-full border border-[#0EA5A4] opacity-20 animate-pulse"
                aria-hidden="true"
              />
            </>
          )}

          {/* Main Token Circle */}
          <div
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full font-medium transition-all duration-300",
              styles.tokenBg
            )}
            role="img"
            aria-label={`Token ${token.tokenNumber}`}
          >
            <span className={cn("text-[28px] font-bold", styles.tokenText)}>
              {token.tokenNumber}
            </span>
          </div>

          {/* Pulsing Green Dot for Active Token */}
          {hasActiveToken && (
            <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
              <div className="absolute inline-flex h-3 w-3 animate-pulse rounded-full bg-[#22c55e] opacity-75" />
              <div className="relative inline-flex h-3 w-3 rounded-full bg-[#22c55e]" />
            </div>
          )}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-[16px] font-medium text-[#0F172A]">
                {token.patientName}
              </CardTitle>
              <CardBody className="mt-1 text-[13px] text-[#64748B]">
                Dr. {token.doctorName}
              </CardBody>
            </div>

            {/* Status Badge */}
            <Badge
              status={
                token.status === "CALLING"
                  ? "success"
                  : token.status === "COMPLETED"
                    ? "error"
                    : "neutral"
              }
              className={cn("px-2 py-1 text-[11px] font-semibold ring-0 flex-shrink-0", styles.badge)}
            >
              {token.status === "NOT_STARTED"
                ? "Pending"
                : token.status === "CALLING"
                  ? "In Progress"
                  : "Completed"}
            </Badge>
          </div>

          {/* Department Badge */}
          <div className="mt-2">
            <Badge
              status="info"
              className={cn("px-2 py-1 text-[10px] font-medium ring-0", styles.badge)}
            >
              {token.department}
            </Badge>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-[#E2E8F0] opacity-50" />

      {/* Date & Time */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0EA5A4]" />
          <div className="min-w-0">
            <Label className="text-[11px] text-[#64748B]">Date</Label>
            <CardBody className="mt-0.5 text-[12px]">
              {formatScheduleDate(token.date)}
            </CardBody>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0EA5A4]" />
          <div className="min-w-0">
            <Label className="text-[11px] text-[#64748B]">Time</Label>
            <CardBody className="mt-0.5 text-[12px]">
              {formatTimeTo12Hour(token.time)}
            </CardBody>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {token.status === "NOT_STARTED" ? (
          <Button
            size="sm"
            onClick={() => void onStatusChange(token.id, "CALLING")}
            loading={isUpdating}
            className="flex-1 text-[13px]"
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
              className="flex-1 text-[13px]"
            >
              End Call
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void onStatusChange(token.id, "NOT_STARTED")}
              loading={isUpdating}
              className="flex-1 text-[13px]"
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
            className="flex-1 text-[13px]"
          >
            Reset
          </Button>
        ) : null}
      </div>
    </article>
  );
}
