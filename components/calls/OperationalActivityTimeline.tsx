"use client";

import { Activity, CheckCircle2, Clock3 } from "lucide-react";
import { Card } from "@/components/ui";
import { formatCallDateTime } from "@/lib/calls";

export interface OperationalTimelineItem {
  id: string;
  title: string;
  description: string;
  occurredAt: number;
  tone: "active" | "resolved";
}

export function OperationalActivityTimeline({
  items,
  title = "Operational activity timeline",
}: {
  items: OperationalTimelineItem[];
  title?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0EA5A4]">
          <Activity className="size-5" />
        </div>
        <div>
          <p className="ui-section-title">{title}</p>
          <p className="ui-body-secondary">Scrollable operational trail for recent doctor-hospital coordination events.</p>
        </div>
      </div>

      <div className="mt-5 max-h-[320px] space-y-4 overflow-y-auto pr-2">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${item.tone === "active" ? "bg-[#F0FDFA] text-[#0EA5A4]" : "bg-[#DCFCE7] text-[#15803D]"}`}>
                {item.tone === "active" ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
              </div>
              <div className="flex-1 rounded-xl border border-[#E2E8F0] p-3">
                <p className="text-sm font-medium text-[#0F172A]">{item.title}</p>
                <p className="mt-1 text-sm text-[#64748B]">{item.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#94A3B8]">{formatCallDateTime(item.occurredAt)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="ui-body-secondary">No operational activity recorded yet.</p>
        )}
      </div>
    </Card>
  );
}
