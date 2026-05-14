"use client";

import { Activity, Building2, MessageSquareText, PhoneIncoming, Radio, TimerReset } from "lucide-react";
import { CallDuration } from "@/components/calls/CallDuration";
import { Card, EndCallButton, Select, StartCallButton } from "@/components/ui";
import { localizeCallMessageLabel, type ActiveCall, type OperationalMessageTemplate } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

const callSelectorCopy = {
  en: {
    title: "Operational Message Board",
    description: "Each message works independently. Messages stay on the left and call on or off controls stay on the right.",
    hospital: "Hospital",
    empty: "No operational messages available yet.",
    start: "Call On",
    end: "Call End",
    statusReady: "Ready",
    statusLive: "Live",
    duration: "Live duration",
  },
} as const;

export function CallMessageSelector({
  targetHospitalId,
  onTargetHospitalChange,
  targetHospitalOptions,
  availableMessages,
  activeCallsByMessageId,
  onStartMessage,
  onEndMessage,
  language,
}: {
  targetHospitalId: string;
  onTargetHospitalChange: (value: string) => void;
  targetHospitalOptions: Array<{ label: string; value: string }>;
  availableMessages: OperationalMessageTemplate[];
  activeCallsByMessageId: Record<string, ActiveCall | undefined>;
  onStartMessage: (messageId: string) => void;
  onEndMessage: (messageId: string) => void;
  language: AppLanguage;
}) {
  const copy = callSelectorCopy.en;

  return (
    <Card className="space-y-5 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#ECFEFF] text-[#0EA5A4] shadow-sm">
          <PhoneIncoming className="size-5" />
        </span>
        <div>
          <p className="text-base font-semibold text-[#0F172A]">{copy.title}</p>
          <p className="mt-1 text-sm text-[#64748B]">{copy.description}</p>
        </div>
      </div>

      <label className="grid gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
          <Building2 className="size-3.5" />
          {copy.hospital}
        </span>
        <Select
          value={targetHospitalId}
          onChange={(event) => onTargetHospitalChange(event.target.value)}
          options={targetHospitalOptions}
        />
      </label>

      <div className="grid gap-3">
        {availableMessages.length ? (
          availableMessages.map((message) => {
            const activeCall = activeCallsByMessageId[message.id];
            const isLive = Boolean(activeCall);

            return (
              <div
                key={message.id}
                className={`rounded-2xl border p-4 transition ${
                  isLive
                    ? "border-[#0EA5A4] bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] shadow-sm"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFEFF] text-[#0EA5A4]">
                        <MessageSquareText className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#0F172A]">
                            {localizeCallMessageLabel(message.label, language)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isLive ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F1F5F9] text-[#475569]"
                            }`}
                          >
                            {isLive ? <Radio className="size-3.5" /> : <Activity className="size-3.5" />}
                            {isLive ? copy.statusLive : copy.statusReady}
                          </span>
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-[#64748B]">
                          <TimerReset className="size-3.5 text-[#0EA5A4]" />
                          <span>{copy.duration}:</span>
                          <span className="font-semibold text-[#0F172A]">
                            {activeCall ? <CallDuration startedAt={activeCall.startedAt} /> : "00:00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    <StartCallButton
                      size="sm"
                      className="rounded-xl"
                      onClick={() => onStartMessage(message.id)}
                      disabled={isLive}
                    >
                      {copy.start}
                    </StartCallButton>
                    <EndCallButton
                      size="sm"
                      className="rounded-xl"
                      onClick={() => onEndMessage(message.id)}
                      disabled={!isLive}
                    >
                      {copy.end}
                    </EndCallButton>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm text-[#64748B]">
            {copy.empty}
          </div>
        )}
      </div>
    </Card>
  );
}
