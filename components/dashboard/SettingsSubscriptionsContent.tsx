"use client";

import { Building2, Stethoscope, WalletCards } from "lucide-react";
import { PageHero, SettingsNavCard } from "@/components/dashboard";

export function SettingsSubscriptionsContent() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Subscription Workspace"
        description="Choose a subscription page."
        icon={<WalletCards className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
        imageAlt="Billing and payment desk"
        stats={[
          { label: "Sections", value: "2" },
        ]}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <SettingsNavCard
          href="/dashboard/settings/subscriptions/hospitals"
          icon={<Building2 className="size-5" />}
          title="Hospital Subscriptions"
          description="Set hospital fees."
        />
        <SettingsNavCard
          href="/dashboard/settings/subscriptions/doctors"
          icon={<Stethoscope className="size-5" />}
          title="Doctor Subscriptions"
          description="Set doctor plans."
        />
      </section>
    </div>
  );
}
