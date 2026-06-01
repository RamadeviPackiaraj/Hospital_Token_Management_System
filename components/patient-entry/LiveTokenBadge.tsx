"use client";

import { cn } from "@/lib/utils";
import type { PatientTokenStatus } from "@/lib/scheduling-types";

interface LiveTokenBadgeProps {
  tokenNumber: number;
  status: PatientTokenStatus;
}

/**
 * LiveTokenBadge - Visually dominant circular token number display
 * 
 * Mimics a hospital queue or scoreboard display with:
 * - Perfect circle (64px, w-16 h-16)
 * - Animated pulsing effect for active tokens
 * - Status-based styling
 * - Centered layout
 */
function getTokenBadgeStyles(status: PatientTokenStatus) {
  switch (status) {
    case "CALLING":
      return {
        circle: "bg-[#0EA5A4] text-white",
        animated: true,
      };
    case "COMPLETED":
      return {
        circle: "bg-[#0EA5A4] text-white opacity-80",
        animated: false,
      };
    case "NOT_STARTED":
    default:
      return {
        circle: "bg-[#C7D2E0] text-white",
        animated: false,
      };
  }
}

export function LiveTokenBadge({ tokenNumber, status }: LiveTokenBadgeProps) {
  const styles = getTokenBadgeStyles(status);

  return (
    <div className="flex justify-center py-2">
      <div className="relative">
        {/* Animated ping ring - only for CALLING status */}
        {styles.animated && (
          <div
            className="absolute inset-0 inline-flex h-16 w-16 animate-ping rounded-full bg-[#0EA5A4] opacity-30"
            aria-hidden="true"
          />
        )}

        {/* Main circular badge */}
        <div
          className={cn(
            "relative inline-flex h-16 w-16 items-center justify-center rounded-full font-medium shadow-md transition-all duration-300",
            styles.circle
          )}
          role="img"
          aria-label={`Token ${tokenNumber} - ${status}`}
        >
          <span className="text-[22px]">{tokenNumber}</span>
        </div>
      </div>
    </div>
  );
}
