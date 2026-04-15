"use client";

import { cn } from "@/lib/utils";
import type { PatientTokenStatus } from "@/lib/scheduling-types";

interface LinearProgressDisplayProps {
  currentToken: number | null;
  status: PatientTokenStatus | null;
  patientName?: string;
  doctorName?: string;
}

/**
 * LinearProgressDisplay - Rotating live token display with rolling design
 * 
 * Hospital queue interface with:
 * - Rotating/spinning circular token number (56-64px)
 * - Pulsing outer ring animation
 * - Clean, centered layout
 * - Status indication
 */
export function LinearProgressDisplay({
  currentToken,
  status,
  patientName = "",
  doctorName = "",
}: LinearProgressDisplayProps) {
  const hasActiveToken = currentToken !== null && status === "CALLING";

  return (
    <div className="w-full rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-8 shadow-sm">
      {/* Header Label */}
      <div className="mb-6 text-center">
        <p className="text-[12px] font-medium text-[#64748B]">CURRENT PROCESSING</p>
      </div>

      {/* Rotating Token Number Display */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-32 w-32">
          {/* Outer Rotating Ring - Continuous rotation */}
          {hasActiveToken && (
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0EA5A4] border-r-[#0EA5A4] border-b-[#E2E8F0] border-l-[#E2E8F0] animate-spin"
              style={{ animationDuration: "2s" }}
              aria-hidden="true"
            />
          )}

          {/* Middle Pulsing Ring */}
          {hasActiveToken && (
            <div
              className="absolute inset-2 rounded-full border border-[#0EA5A4] opacity-30 animate-pulse"
              aria-hidden="true"
            />
          )}

          {/* Inner Circle - Main Token Display */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full font-bold transition-all duration-300",
              hasActiveToken
                ? "bg-[#0EA5A4] text-white shadow-lg"
                : "bg-[#F8FAFC] text-[#0F172A] border-2 border-[#E2E8F0]"
            )}
          >
            <span className="text-[56px] font-bold">
              {currentToken !== null ? currentToken : "—"}
            </span>
          </div>

          {/* Pulsing Green Dot - Only for active */}
          {hasActiveToken && (
            <div className="absolute -right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
              <div className="absolute inline-flex h-4 w-4 animate-pulse rounded-full bg-[#22c55e] opacity-75" />
              <div className="relative inline-flex h-4 w-4 rounded-full bg-[#22c55e]" />
            </div>
          )}
        </div>

        {/* Patient & Doctor Info */}
        {currentToken !== null && (
          <div className="text-center">
            {patientName && (
              <p className="text-[18px] font-bold text-[#0F172A]">{patientName}</p>
            )}
            {doctorName && (
              <p className="mt-2 text-[14px] font-medium text-[#64748B]">
                Dr. {doctorName}
              </p>
            )}

            {/* Status Indicator */}
            {status && (
              <div className="mt-4">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold",
                    status === "CALLING"
                      ? "bg-[#DCFCE7] text-[#15803D]"
                      : status === "COMPLETED"
                        ? "bg-[#FEE2E2] text-[#DC2626]"
                        : "bg-[#F0FDFA] text-[#0EA5A4]"
                  )}
                >
                  {status === "CALLING" && (
                    <span className="relative inline-flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#22c55e] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                    </span>
                  )}
                  {status === "CALLING"
                    ? "In Progress"
                    : status === "COMPLETED"
                      ? "Completed"
                      : "Not Started"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {currentToken === null && (
          <div className="text-center">
            <p className="text-[14px] font-medium text-[#64748B]">No active token</p>
            <p className="mt-1 text-[12px] text-[#94A3B8]">Start processing patients</p>
          </div>
        )}
      </div>
    </div>
  );
}
