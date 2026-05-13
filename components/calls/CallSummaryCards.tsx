"use client";

import { PhoneCall, PhoneOff, Siren, TimerReset } from "lucide-react";
import { StatCard } from "@/components/ui";

export function CallSummaryCards({
  activeCount,
  criticalCount,
  completedCount,
  avgDuration,
}: {
  activeCount: number;
  criticalCount: number;
  completedCount: number;
  avgDuration: string;
}) {
  const items = [
    { label: "Active calls", value: String(activeCount), icon: <PhoneCall className="size-5" /> },
    { label: "Critical alerts", value: String(criticalCount), icon: <Siren className="size-5" /> },
    { label: "Resolved today", value: String(completedCount), icon: <PhoneOff className="size-5" /> },
    { label: "Average duration", value: avgDuration, icon: <TimerReset className="size-5" /> },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
      ))}
    </div>
  );
}
