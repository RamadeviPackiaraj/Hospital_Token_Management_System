"use client";

import * as React from "react";
import { Check, Languages } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type GlobalLanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function GlobalLanguageSwitcher({ className, compact = false }: GlobalLanguageSwitcherProps) {
  const { language, changeLanguage } = useI18n();
  const [status, setStatus] = React.useState("");
  const isEnglishActive = language === DEFAULT_LANGUAGE;

  const handleResetToEnglish = React.useCallback(async () => {
    if (isEnglishActive) return;
    await changeLanguage(DEFAULT_LANGUAGE);
    setStatus("English selected");
  }, [changeLanguage, isEnglishActive]);

  React.useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <div className={cn("flex items-center", compact ? "max-w-[96px]" : "max-w-[120px]", className)}>
      <button
        type="button"
        onClick={handleResetToEnglish}
        disabled={isEnglishActive}
        aria-label="Switch application language to English"
        aria-pressed={isEnglishActive}
        className={cn(
          "focus-ring inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium shadow-sm transition",
          isEnglishActive
            ? "cursor-default border-[#99F6E4] bg-[#ECFEFF] text-[#0F766E]"
            : "border-[#FDE68A] bg-white text-[#0F766E] hover:border-[#F59E0B] hover:bg-[#FFFBEB] hover:text-[#0F766E]",
          compact ? "min-w-[88px]" : "min-w-[96px]"
        )}
        >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full",
            isEnglishActive ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-[#FEF3C7] text-[#D97706]"
          )}
          aria-hidden="true"
        >
          {isEnglishActive ? <Check className="size-3" /> : <Languages className="size-3" />}
        </span>
        English
      </button>

      <span className="sr-only" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
