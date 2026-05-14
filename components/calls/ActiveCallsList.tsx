"use client";

import type { ReactNode } from "react";
import { BellDot, Building2, Clock3, MessageSquareText, Siren, Stethoscope, TimerReset } from "lucide-react";
import { Card, EmptyState, EndCallButton } from "@/components/ui";
import { CallDuration } from "@/components/calls/CallDuration";
import { formatCallDateTime, localizeCallMessageLabel, type ActiveCall } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

export function ActiveCallsList({
  calls,
  emptyTitle,
  emptyDescription,
  onEnd,
  language,
  endLabel = "End Call",
}: {
  calls: ActiveCall[];
  emptyTitle: string;
  emptyDescription: string;
  onEnd: (callId: string) => void;
  language: AppLanguage;
  endLabel?: string;
}) {
  if (!calls.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={<BellDot className="size-5" />} />;
  }

  return (
    <div className="grid gap-4">
      {calls.map((call) => (
        <Card key={call.id} className="overflow-hidden border-[#E2E8F0] bg-[#F0FDFA] p-0 shadow-sm">
          <div className="border-b border-[#E2E8F0] bg-[#F0FDFA] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0EA5A4] shadow-sm">
                  <Siren className="size-4.5" />
                </span>
                <div>
                  <p className="text-base font-medium text-[#0F172A]">{call.doctorName}</p>
                  <p className="mt-0.5 text-sm text-[#64748B]">{call.department}</p>
                </div>
              </div>
              <EndCallButton size="sm" className="rounded-xl" onClick={() => onEnd(call.id)}>
                {endLabel}
              </EndCallButton>
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <DetailCard icon={<Building2 className="size-4" />} label="Hospital" value={call.hospitalName} muted />
            <DetailCard
              icon={<MessageSquareText className="size-4" />}
              label="Message"
              value={localizeCallMessageLabel(call.messageLabel, language)}
              muted
            />
            <DetailCard icon={<Clock3 className="size-4" />} label="Started" value={formatCallDateTime(call.startedAt)} />
            <DetailCard icon={<TimerReset className="size-4" />} label="Duration" value={<CallDuration startedAt={call.startedAt} />} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${muted ? "border-[#E2E8F0] bg-white" : "border-[#E2E8F0] bg-white"}`}>
      <div className="flex items-center gap-2 text-[#0EA5A4]">
        {icon}
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#0EA5A4]">{label}</p>
      </div>
      <p className="mt-3 text-sm font-normal text-[#0F172A]">{value}</p>
    </div>
  );
}
