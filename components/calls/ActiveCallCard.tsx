"use client";

import type { ReactNode } from "react";
import { Building2, Clock3, MessageSquareText, PhoneForwarded, Sparkles, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui";
import { CallDuration } from "@/components/calls/CallDuration";
import { formatCallDateTime, localizeCallMessageLabel, type ActiveCall } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

const activeCallCardCopy = {
  en: {
    title: "Active Call",
    description: "Current doctor to hospital operational call.",
    doctor: "Doctor",
    hospital: "Hospital",
    department: "Department",
    started: "Started",
    message: "Message",
    duration: "Duration",
  },
  ta: {
    title: "செயலில் உள்ள அழைப்பு",
    description: "தற்போதைய மருத்துவர் முதல் மருத்துவமனை செயல்பாட்டு அழைப்பு.",
    doctor: "மருத்துவர்",
    hospital: "மருத்துவமனை",
    department: "துறை",
    started: "தொடங்கியது",
    message: "செய்தி",
    duration: "நேரம்",
  },
  hi: {
    title: "सक्रिय कॉल",
    description: "वर्तमान डॉक्टर से अस्पताल संचालन कॉल।",
    doctor: "डॉक्टर",
    hospital: "अस्पताल",
    department: "विभाग",
    started: "शुरू हुआ",
    message: "संदेश",
    duration: "अवधि",
  },
  ml: {
    title: "സജീവ കോൾ",
    description: "നിലവിലെ ഡോക്ടർ മുതൽ ആശുപത്രിയിലേക്ക് പ്രവർത്തന കോൾ.",
    doctor: "ഡോക്ടർ",
    hospital: "ആശുപത്രി",
    department: "വിഭാഗം",
    started: "ആരംഭിച്ചത്",
    message: "സന്ദേശം",
    duration: "ദൈർഘ്യം",
  },
} as const;

export function ActiveCallCard({
  call,
  language,
}: {
  call: ActiveCall;
  language: AppLanguage;
}) {
  const copy = activeCallCardCopy[language] || activeCallCardCopy.en;

  return (
    <Card className="overflow-hidden border-[#D9F99D] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FFFA_100%)] p-0 shadow-sm">
      <div className="border-b border-[#ECFCCB] bg-[linear-gradient(135deg,#ECFEFF_0%,#F0FDF4_100%)] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#0EA5A4] shadow-sm">
              <PhoneForwarded className="size-5" />
            </span>
            <div>
              <p className="text-base font-semibold text-[#0F172A]">{copy.title}</p>
              <p className="mt-1 text-sm text-[#64748B]">{copy.description}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]">
            <Sparkles className="size-3.5" />
            Live
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Info icon={<Stethoscope className="size-4" />} label={copy.doctor} value={call.doctorName} />
            <Info icon={<Building2 className="size-4" />} label={copy.hospital} value={call.hospitalName} />
            <Info icon={<Stethoscope className="size-4" />} label={copy.department} value={call.department} />
            <Info icon={<Clock3 className="size-4" />} label={copy.started} value={formatCallDateTime(call.startedAt)} />
          </div>

          <div className="rounded-2xl border border-[#D9F99D] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#64748B]">
              <MessageSquareText className="size-4" />
              <p className="text-xs font-medium">{copy.message}</p>
            </div>
            <p className="mt-2 text-sm text-[#0F172A]">{localizeCallMessageLabel(call.messageLabel, language)}</p>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-[#99F6E4] bg-[linear-gradient(180deg,#ECFEFF_0%,#FFFFFF_100%)] p-5 lg:max-w-[240px]">
          <p className="text-xs font-medium text-[#64748B]">{copy.duration}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">
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
      <div className="flex items-center gap-2 text-[#0EA5A4]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0EA5A4]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-[#0F172A]">{value}</p>
    </div>
  );
}
