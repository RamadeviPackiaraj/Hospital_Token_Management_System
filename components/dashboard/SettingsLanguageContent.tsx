"use client";

import { Languages } from "lucide-react";
import { LanguageSettingsPanel, PageHero } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import { getLanguageLabel } from "@/lib/i18n";

export function SettingsLanguageContent() {
  const { language, t } = useI18n();

  return (
    <div className="space-y-6">
      <PageHero
        title={t("settings.languageTitle")}
        description={t("settings.languageDescription")}
        icon={<Languages className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
        imageAlt={t("settings.languageImageAlt")}
        stats={[
          { label: t("settings.languageLabel"), value: getLanguageLabel(language, t) },
          { label: t("common.editable"), value: t("common.yes") },
        ]}
      />

      <LanguageSettingsPanel />
    </div>
  );
}
