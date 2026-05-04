"use client";

import { Plus } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { SectionTitle, BodySecondary } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface CreateEntryCardProps {
  active?: boolean;
  onClick: () => void;
}

export function CreateEntryCard({ active = false, onClick }: CreateEntryCardProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring w-full rounded-[10px] border border-dashed border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-panel transition-colors duration-200 hover:border-[#0EA5A4]",
        active && "border-[#0EA5A4] bg-[#F0FDFA]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#0EA5A4]">
          <Plus className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-left">
          <SectionTitle>{t("patientEntry.newEntry")}</SectionTitle>
          <BodySecondary className="mt-1">{t("patientEntry.newEntryDescription")}</BodySecondary>
        </div>
      </div>
    </button>
  );
}
