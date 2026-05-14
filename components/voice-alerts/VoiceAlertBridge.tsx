"use client";

import * as React from "react";
import { Volume2 } from "lucide-react";
import { Card } from "@/components/ui";
import { useVoiceNotification } from "@/hooks/useVoiceNotification";
import { localizeCallDepartmentLabel, localizeCallMessageLabel, type ActiveCall } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";

const voiceAlertCopy = {
  en: {
    title: "Voice Notification",
    description: "New doctor calls are announced in the hospital module using the selected application language.",
    toast: "{{doctor}} from {{department}}: {{message}}",
  },
  ta: {
    title: "குரல் அறிவிப்பு",
    description: "புதிய மருத்துவர் அழைப்புகள் தேர்ந்தெடுக்கப்பட்ட பயன்பாட்டு மொழியில் மருத்துவமனை பகுதியில் அறிவிக்கப்படும்.",
    toast: "{{department}} பிரிவிலிருந்து {{doctor}}: {{message}}",
  },
  hi: {
    title: "वॉइस सूचना",
    description: "नई डॉक्टर कॉल चुनी गई एप्लिकेशन भाषा में अस्पताल मॉड्यूल में सुनाई जाएगी।",
    toast: "{{department}} से {{doctor}}: {{message}}",
  },
  ml: {
    title: "ശബ്ദ അറിയിപ്പ്",
    description: "തിരഞ്ഞെടുത്ത ഭാഷയിൽ പുതിയ ഡോക്ടർ കോളുകൾ ആശുപത്രി മോഡ്യൂളിൽ അറിയിക്കും.",
    toast: "{{department}} ൽ നിന്ന് {{doctor}}: {{message}}",
  },
} as const;

export function VoiceAlertBridge({
  activeCalls,
  language,
}: {
  activeCalls: ActiveCall[];
  language: AppLanguage;
}) {
  useVoiceNotification(activeCalls, language, true);
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
      const copy = voiceAlertCopy[language] || voiceAlertCopy.en;
      const department = localizeCallDepartmentLabel(call.department, language);
      const message = localizeCallMessageLabel(call.messageLabel, language);
      const toastMessage = copy.toast
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

  const copy = voiceAlertCopy[language] || voiceAlertCopy.en;

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#0EA5A4]">
          <Volume2 className="size-4" />
        </div>
        <div>
          <p className="text-base font-medium text-[#0F172A]">{copy.title}</p>
          <p className="mt-1 text-sm text-[#64748B]">{copy.description}</p>
        </div>
      </div>
    </Card>
  );
}
