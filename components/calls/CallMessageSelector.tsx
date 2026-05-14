"use client";

import { Building2, CheckCircle2, MessageSquareText, PhoneIncoming } from "lucide-react";
import { Card, EndCallButton, Select, StartCallButton } from "@/components/ui";
import { localizeCallMessageLabel, type OperationalMessageTemplate } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

const callSelectorCopy = {
  en: {
    title: "Start Call",
    description: "Choose one hospital and one operational message.",
    hospital: "Hospital",
    helper: "Doctor to hospital message",
    empty: "No call messages available yet.",
    start: "Start Call",
    end: "End Call",
  },
  ta: {
    title: "அழைப்பை தொடங்கு",
    description: "ஒரு மருத்துவமனையும் ஒரு செயல்பாட்டு செய்தியையும் தேர்வு செய்யவும்.",
    hospital: "மருத்துவமனை",
    helper: "மருத்துவரிடமிருந்து மருத்துவமனைக்கு செய்தி",
    empty: "இன்னும் அழைப்பு செய்திகள் இல்லை.",
    start: "அழைப்பை தொடங்கு",
    end: "அழைப்பை முடி",
  },
  hi: {
    title: "कॉल शुरू करें",
    description: "एक अस्पताल और एक संचालन संदेश चुनें।",
    hospital: "अस्पताल",
    helper: "डॉक्टर से अस्पताल संदेश",
    empty: "अभी कोई कॉल संदेश उपलब्ध नहीं है।",
    start: "कॉल शुरू करें",
    end: "कॉल समाप्त करें",
  },
  ml: {
    title: "കോൾ ആരംഭിക്കുക",
    description: "ഒരു ആശുപത്രിയും ഒരു പ്രവർത്തന സന്ദേശവും തിരഞ്ഞെടുക്കുക.",
    hospital: "ആശുപത്രി",
    helper: "ഡോക്ടറിൽ നിന്ന് ആശുപത്രിയിലേക്ക് സന്ദേശം",
    empty: "ഇപ്പോൾ കോൾ സന്ദേശങ്ങളില്ല.",
    start: "കോൾ ആരംഭിക്കുക",
    end: "കോൾ അവസാനിപ്പിക്കുക",
  },
} as const;

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
  language,
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
  language: AppLanguage;
}) {
  const copy = callSelectorCopy[language] || callSelectorCopy.en;

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

      <div className="grid gap-3 md:grid-cols-3">
        {availableMessages.length ? (
          availableMessages.map((message) => {
            const active = selectedMessageId === message.id;
            return (
              <button
                key={message.id}
                type="button"
                onClick={() => onSelectedMessageChange(message.id)}
                className={`group rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-[#0EA5A4] bg-[linear-gradient(180deg,#F0FDFA_0%,#F8FAFC_100%)] shadow-sm"
                    : "border-[#E2E8F0] bg-white hover:border-[#0EA5A4] hover:bg-[#FCFFFE]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-[#ECFEFF] text-[#0EA5A4]">
                      <MessageSquareText className="size-4" />
                    </span>
                    <p className="text-sm font-semibold text-[#0F172A]">{localizeCallMessageLabel(message.label, language)}</p>
                    <p className="mt-2 text-xs text-[#64748B]">{copy.helper}</p>
                  </div>
                  {active ? <CheckCircle2 className="size-5 text-[#0EA5A4]" /> : null}
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm text-[#64748B] md:col-span-3">
            {copy.empty}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <StartCallButton size="sm" className="rounded-xl" onClick={onStart} disabled={!canStart}>
          {copy.start}
        </StartCallButton>
        <EndCallButton size="sm" className="rounded-xl" onClick={onEnd} disabled={!canEnd}>
          {copy.end}
        </EndCallButton>
      </div>
    </Card>
  );
}
