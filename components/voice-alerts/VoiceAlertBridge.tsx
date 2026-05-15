"use client";

import * as React from "react";
import { BellRing } from "lucide-react";
import { useVoiceNotification } from "@/hooks/useVoiceNotification";
import { localizeCallDepartmentLabel, localizeCallMessageLabel, type ActiveCall } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";

const voiceAlertCopy = {
  en: {
    toast: "{{doctor}} from {{department}}: {{message}}",
  },
} as const;

export function VoiceAlertBridge({
  activeCalls,
  language,
  compact = false,
}: {
  activeCalls: ActiveCall[];
  language: AppLanguage;
  compact?: boolean;
}) {
  const { isSpeaking } = useVoiceNotification(activeCalls, language, true);
  const seenCallIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const seenCallIds = seenCallIdsRef.current;

    if (seenCallIds.size === 0) {
      activeCalls.forEach((call) => {
        seenCallIds.add(call.id);
      });
      return;
    }

    activeCalls.forEach((call) => {
      if (seenCallIds.has(call.id)) {
        return;
      }

      seenCallIds.add(call.id);
      const department = localizeCallDepartmentLabel(call.department, language);
      const message = localizeCallMessageLabel(call.messageLabel, language);
      const toastMessage = voiceAlertCopy.en.toast
        .replace("{{doctor}}", call.doctorName)
        .replace("{{department}}", department)
        .replace("{{message}}", message);

      logger.info(toastMessage, {
        toast: true,
        source: "hospital-call-notification",
      });
    });

    const activeCallIds = new Set(activeCalls.map((call) => call.id));
    Array.from(seenCallIds).forEach((callId) => {
      if (!activeCallIds.has(callId)) {
        seenCallIds.delete(callId);
      }
    });
  }, [activeCalls, language]);

  const icon = (
    <div className="relative flex size-10 items-center justify-center">
      {isSpeaking ? (
        <>
          <span className="absolute inset-0 rounded-full bg-[#5EEAD4]/50 animate-ping" aria-hidden="true" />
          <span className="absolute inset-[-6px] rounded-full border border-[#99F6E4] animate-pulse" aria-hidden="true" />
        </>
      ) : null}
      <div
        className={`relative flex size-10 items-center justify-center rounded-full bg-white text-[#0EA5A4] shadow-sm transition-transform ${
          isSpeaking ? "scale-110" : "scale-100"
        }`}
        aria-label="Voice alert status"
        title={isSpeaking ? "Voice alert playing" : "Voice alert ready"}
      >
        <BellRing className={`size-4.5 ${isSpeaking ? "animate-pulse" : ""}`} />
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[#D1FAE5] bg-[linear-gradient(180deg,#F0FDFA_0%,#FFFFFF_100%)] p-3">
        {icon}
      </div>
    );
  }

  return <div className="flex items-center justify-center">{icon}</div>;
}
