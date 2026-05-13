"use client";

import type { ReactNode } from "react";
import { Building2, Clock3, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui";
import { CallDuration } from "@/components/calls/CallDuration";
import { formatCallDateTime, type ActiveCall } from "@/lib/calls";

export function ActiveCallCard({
  call,
}: {
  call: ActiveCall;
}) {
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div>
            <p className="text-base font-medium text-[#0F172A]">Active Call</p>
            <p className="mt-1 text-sm text-[#64748B]">Current doctor to hospital operational call.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Info icon={<Stethoscope className="size-4" />} label="Doctor" value={call.doctorName} />
            <Info icon={<Building2 className="size-4" />} label="Hospital" value={call.hospitalName} />
            <Info icon={<Stethoscope className="size-4" />} label="Department" value={call.department} />
            <Info icon={<Clock3 className="size-4" />} label="Started" value={formatCallDateTime(call.startedAt)} />
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-xs font-medium text-[#64748B]">Message</p>
            <p className="mt-2 text-sm text-[#0F172A]">{call.messageLabel}</p>
          </div>
        </div>

        <div className="w-full rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-4 lg:max-w-[220px]">
          <p className="text-xs font-medium text-[#64748B]">Duration</p>
          <p className="mt-2 text-xl font-medium text-[#0F172A]">
            <CallDuration startedAt={call.startedAt} />
          </p>
        </div>
      </div>
    </Card>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
      <div className="flex items-center gap-2 text-[#64748B]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-sm text-[#0F172A]">{value}</p>
    </div>
  );
}
