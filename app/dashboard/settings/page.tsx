"use client";

import { Languages, LayoutList, WalletCards } from "lucide-react";
import { SettingsNavCard, useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";

export default function SettingsPage() {
  const { currentUser } = useDashboardContext();
  const { t } = useI18n();
  const showAdminSettings = currentUser.role === "admin";

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <SettingsNavCard
        href="/dashboard/settings/language"
        icon={<Languages className="size-5" />}
        title={t("settings.languageTitle")}
        description={t("settings.languageDescription")}
      />

      {showAdminSettings ? (
        <>
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
        </>
      ) : null}
    </section>
  );
}
