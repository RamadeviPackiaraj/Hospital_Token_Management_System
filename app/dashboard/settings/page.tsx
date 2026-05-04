"use client";

import { LayoutList, WalletCards } from "lucide-react";
import { LanguageSettingsPanel, SettingsNavCard, useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";

export default function SettingsPage() {
  const { currentUser } = useDashboardContext();
  const { t } = useI18n();
  const showAdminSettings = currentUser.role === "admin";

  return (
    <div className="space-y-6">
      <LanguageSettingsPanel />

      {showAdminSettings ? (
        <section className="grid gap-6 md:grid-cols-2">
          <SettingsNavCard
            href="/dashboard/settings/departments"
            icon={<LayoutList className="size-5" />}
            title={t("settings.departments")}
            description={t("settings.departmentsDescription")}
          />
          <SettingsNavCard
            href="/dashboard/settings/subscriptions"
            icon={<WalletCards className="size-5" />}
            title={t("settings.subscriptions")}
            description={t("settings.subscriptionsDescription")}
          />
        </section>
      ) : null}
    </div>
  );
}
