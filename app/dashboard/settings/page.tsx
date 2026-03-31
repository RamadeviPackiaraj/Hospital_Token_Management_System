"use client";

import { LayoutList, WalletCards } from "lucide-react";
import { SettingsNavCard } from "@/components/dashboard";

export default function SettingsPage() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <SettingsNavCard
        href="/dashboard/settings/departments"
        icon={<LayoutList className="size-5" />}
        title="Departments"
        description="Manage hospital departments"
      />
      <SettingsNavCard
        href="/dashboard/settings/subscriptions"
        icon={<WalletCards className="size-5" />}
        title="Subscriptions"
        description="Manage plans and pricing"
      />
    </section>
  );
}
