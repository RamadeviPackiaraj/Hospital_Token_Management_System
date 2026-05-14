"use client";

import * as React from "react";
import { Volume2 } from "lucide-react";
import { Card } from "@/components/ui";
import { useVoiceNotification } from "@/hooks/useVoiceNotification";
import type { ActiveCall } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";

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
      logger.info(`doctor call {${call.messageLabel}}`, {
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
  }, [activeCalls]);

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#0EA5A4]">
          <Volume2 className="size-4" />
        </div>
        <div>
          <p className="text-base font-medium text-[#0F172A]">Voice Notification</p>
          <p className="mt-1 text-sm text-[#64748B]">
            New doctor calls are announced in the hospital module using the selected application language.
          </p>
        </div>
      </div>
    </Card>
  );
}
