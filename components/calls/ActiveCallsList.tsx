"use client";

import type { ReactNode } from "react";
import { BellDot } from "lucide-react";
import { Card, EmptyState, EndCallButton } from "@/components/ui";
import { CallDuration } from "@/components/calls/CallDuration";
import { formatCallDateTime, type ActiveCall } from "@/lib/calls";

export function ActiveCallsList({
  calls,
  emptyTitle,
  emptyDescription,
  onEnd,
}: {
  calls: ActiveCall[];
  emptyTitle: string;
  emptyDescription: string;
  onEnd: (callId: string) => void;
}) {
  if (!calls.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={<BellDot className="size-5" />} />;
  }

  return (
    <div className="grid gap-4">
      {calls.map((call) => (
        <Card key={call.id} className="p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-medium text-[#0F172A]">{call.doctorName}</p>
              <p className="mt-1 text-sm text-[#64748B]">{call.department}</p>
            </div>
            <EndCallButton size="sm" onClick={() => onEnd(call.id)}>
              End Call
            </EndCallButton>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <DetailCard label="Hospital" value={call.hospitalName} muted />
            <DetailCard label="Message" value={call.messageLabel} muted />
            <DetailCard label="Started" value={formatCallDateTime(call.startedAt)} />
            <DetailCard label="Duration" value={<CallDuration startedAt={call.startedAt} />} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function DetailCard({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-[#E2E8F0] p-4 ${muted ? "bg-[#F8FAFC]" : "bg-[#FFFFFF]"}`}>
      <p className="text-xs font-medium text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm text-[#0F172A]">{value}</p>
    </div>
  );
}
