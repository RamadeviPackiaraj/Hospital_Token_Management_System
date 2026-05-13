"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, EndCallButton, Select, StartCallButton } from "@/components/ui";
import { type OperationalMessageTemplate } from "@/lib/calls";

export function CallMessageSelector({
  targetHospitalId,
  onTargetHospitalChange,
  targetHospitalOptions,
  selectedMessageId,
  onSelectedMessageChange,
  availableMessages,
  canStart,
  onStart,
  canEnd,
  onEnd,
}: {
  targetHospitalId: string;
  onTargetHospitalChange: (value: string) => void;
  targetHospitalOptions: Array<{ label: string; value: string }>;
  selectedMessageId: string;
  onSelectedMessageChange: (messageId: string) => void;
  availableMessages: OperationalMessageTemplate[];
  canStart: boolean;
  onStart: () => void;
  canEnd: boolean;
  onEnd: () => void;
}) {
  return (
    <Card className="space-y-4 p-4 shadow-sm">
      <div>
        <p className="text-base font-medium text-[#0F172A]">Start Call</p>
        <p className="mt-1 text-sm text-[#64748B]">Choose one hospital and one operational message.</p>
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-medium text-[#64748B]">Hospital</span>
        <Select
          value={targetHospitalId}
          onChange={(event) => onTargetHospitalChange(event.target.value)}
          options={targetHospitalOptions}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        {availableMessages.map((message) => {
          const active = selectedMessageId === message.id;
          return (
            <button
              key={message.id}
              type="button"
              onClick={() => onSelectedMessageChange(message.id)}
              className={`rounded-lg border p-4 text-left transition ${
                active ? "border-[#0EA5A4] bg-[#F8FAFC]" : "border-[#E2E8F0] bg-white hover:border-[#0EA5A4]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{message.label}</p>
                  <p className="mt-1 text-xs text-[#64748B]">Doctor to hospital message</p>
                </div>
                {active ? <CheckCircle2 className="size-4 text-[#0EA5A4]" /> : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <StartCallButton size="sm" onClick={onStart} disabled={!canStart}>
          Start Call
        </StartCallButton>
        <EndCallButton size="sm" onClick={onEnd} disabled={!canEnd}>
          End Call
        </EndCallButton>
      </div>
    </Card>
  );
}
