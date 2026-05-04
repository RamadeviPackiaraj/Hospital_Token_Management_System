"use client";

import { Building2, Stethoscope, WalletCards } from "lucide-react";
import { PageHero, SettingsNavCard } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";

export function SettingsSubscriptionsContent() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <PageHero
        title={t("subscriptions.workspaceTitle")}
        description={t("subscriptions.workspaceDescription")}
        icon={<WalletCards className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
        imageAlt={t("subscriptions.imageAlt")}
        stats={[
          { label: t("subscriptions.sections"), value: "2" },
        ]}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <SettingsNavCard
          href="/dashboard/settings/subscriptions/hospitals"
          icon={<Building2 className="size-5" />}
          title={t("subscriptions.hospitalsTitle")}
          description={t("subscriptions.hospitalsDescription")}
        />
        <SettingsNavCard
          href="/dashboard/settings/subscriptions/doctors"
          icon={<Stethoscope className="size-5" />}
          title={t("subscriptions.doctorsTitle")}
          description={t("subscriptions.doctorsDescription")}
        />
      </section>
    </div>
  );
}
