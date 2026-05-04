"use client";

import { Badge } from "@/components/ui";
import { useI18n } from "@/components/i18n";
import type { PatientTokenStatus } from "@/lib/scheduling-types";
import { cn } from "@/lib/utils";

interface LinearProgressDisplayProps {
  currentToken: number | null;
  status: PatientTokenStatus | null;
  compact?: boolean;
}

function getStatusStyles(status: PatientTokenStatus | null) {
  if (status === "CALLING") {
    return {
      panel: "border-[#BBF7D0] bg-[#F0FDF4]",
      ring: "border-[#22C55E]",
      core: "border-[#22C55E] bg-[#DCFCE7] text-[#15803D]",
      badge: "success" as const,
      labelKey: "patientEntry.calling",
      animate: true,
    };
  }

  return {
    panel: "border-[#E2E8F0] bg-[#F8FAFC]",
    ring: "border-[#CBD5E1]",
    core: "border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A]",
    badge: "neutral" as const,
    labelKey: "patientEntry.waiting",
    animate: false,
  };
}

export function LinearProgressDisplay({
  currentToken,
  status,
  compact = false,
}: LinearProgressDisplayProps) {
  const { t } = useI18n();
  const styles = getStatusStyles(status);
  const tokenValue = currentToken !== null ? currentToken : "--";

  const tokenView = (
    <div
      className={cn(
        "rounded-[10px] border p-4",
        styles.panel,
        compact ? "flex h-[136px] w-[164px] items-center justify-center px-3 py-2" : "w-full"
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="ui-meta">{t(styles.labelKey)}</div>

        <div className="relative flex h-20 w-20 items-center justify-center">
          <div
            className={cn(
              "absolute inset-0 rounded-full border-2 border-dashed",
              styles.ring,
              styles.animate ? "animate-spin" : ""
            )}
            style={styles.animate ? { animationDuration: "7s" } : undefined}
            aria-hidden="true"
          />
          <div
            className={cn(
              "absolute inset-[7px] rounded-full border opacity-50",
              styles.ring,
              styles.animate ? "animate-pulse" : ""
            )}
            aria-hidden="true"
          />
          <div
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full border ui-page-title leading-none",
              styles.core
            )}
            aria-label={currentToken !== null ? `${t("patientEntry.token")} ${currentToken}` : t("patientEntry.noActiveToken")}
          >
            {tokenValue}
          </div>
          {styles.animate ? (
            <div className="absolute inset-[-8px] rounded-full border border-[#22C55E]/20 animate-ping" aria-hidden="true" />
          ) : null}
        </div>

        <Badge status={styles.badge} className="rounded-lg px-3 py-1 ui-meta">
          {currentToken !== null ? `${t("patientEntry.token")} ${tokenValue}` : t("patientEntry.noActiveToken")}
        </Badge>
      </div>
    </div>
  );

  if (compact) {
    return <div className="min-w-0">{tokenView}</div>;
  }

  return <div className="ui-card">{tokenView}</div>;
}
