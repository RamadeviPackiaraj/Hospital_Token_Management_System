"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Card, Select } from "@/components/ui";
import { languageOptions, type AppLanguage } from "@/lib/i18n";

export function LanguageSettingsPanel() {
  const { language, changeLanguage, t } = useI18n();
  const [status, setStatus] = React.useState("");

  async function handleLanguageChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLanguage = event.target.value as AppLanguage;
    setStatus("");
    await changeLanguage(nextLanguage);
    setStatus(t("settings.languageSaved"));
  }

  return (
    <Card className="h-full p-4">
      <div className="flex h-full flex-col gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
            <Languages className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="ui-section-title">{t("settings.languageTitle")}</h2>
            <p className="mt-1 ui-body-secondary">{t("settings.languageDescription")}</p>
          </div>
        </div>

        <div className="mt-auto">
          <label className="mb-2 block text-sm font-medium text-[#0F172A]" htmlFor="app-language">
            {t("settings.languageLabel")}
          </label>
          <Select
            id="app-language"
            value={language}
            onChange={handleLanguageChange}
            options={[...languageOptions]}
            aria-label={t("settings.languageLabel")}
          />
          {status ? <p className="mt-2 text-sm text-[#15803D]">{status}</p> : null}
        </div>
      </div>
    </Card>
  );
}
