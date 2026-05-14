"use client";

import * as React from "react";
import type { ActiveCall } from "@/lib/calls";
import { buildVoiceNotificationMessage, getSpeechLanguage } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

const REPEAT_ANNOUNCEMENT_INTERVAL_MS = 2000;

function getVoicesForLanguage(language: string) {
  if (typeof window === "undefined") {
    return [];
  }

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase()));
}

export function useVoiceNotification(activeCalls: ActiveCall[], language: AppLanguage, enabled = true) {
  const queueIndexRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (!activeCalls.length) {
      window.speechSynthesis.cancel();
      return;
    }

    const speakNext = () => {
      if (!activeCalls.length) {
        return;
      }

      const voices = getVoicesForLanguage(getSpeechLanguage(language));
      if (queueIndexRef.current >= activeCalls.length) {
        queueIndexRef.current = 0;
      }

      const call = activeCalls[queueIndexRef.current];
      const utterance = new SpeechSynthesisUtterance(buildVoiceNotificationMessage(call, language));
      utterance.lang = getSpeechLanguage(language);
      utterance.rate = 1.02;
      if (voices[0]) {
        utterance.voice = voices[0];
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      queueIndexRef.current = (queueIndexRef.current + 1) % activeCalls.length;
    };

    if (window.speechSynthesis.getVoices().length) {
      speakNext();
    } else {
      window.speechSynthesis.onvoiceschanged = speakNext;
    }

    const intervalId = window.setInterval(() => {
      if (window.speechSynthesis.speaking) {
        return;
      }
      speakNext();
    }, REPEAT_ANNOUNCEMENT_INTERVAL_MS);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.clearInterval(intervalId);
    };
  }, [activeCalls, enabled, language]);
}
