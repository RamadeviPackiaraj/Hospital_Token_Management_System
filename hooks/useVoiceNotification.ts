"use client";

import * as React from "react";
import type { ActiveCall } from "@/lib/calls";
import { buildVoiceNotificationMessage, getSpeechLanguage } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

const REPEAT_ANNOUNCEMENT_INTERVAL_MS = 15000;

function getVoicesForLanguage(language: string) {
  if (typeof window === "undefined") {
    return [];
  }

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase()));
}

export function useVoiceNotification(activeCalls: ActiveCall[], language: AppLanguage, enabled = true) {
  React.useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (!activeCalls.length) {
      window.speechSynthesis.cancel();
      return;
    }

    const speak = () => {
      const voices = getVoicesForLanguage(getSpeechLanguage(language));

      activeCalls.forEach((call) => {
        const utterance = new SpeechSynthesisUtterance(buildVoiceNotificationMessage(call, language));
        utterance.lang = getSpeechLanguage(language);
        utterance.rate = 1;
        if (voices[0]) {
          utterance.voice = voices[0];
        }
        window.speechSynthesis.speak(utterance);
      });
    };

    if (window.speechSynthesis.getVoices().length) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = speak;
    }

    const intervalId = window.setInterval(() => {
      if (window.speechSynthesis.speaking) {
        return;
      }
      speak();
    }, REPEAT_ANNOUNCEMENT_INTERVAL_MS);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.clearInterval(intervalId);
    };
  }, [activeCalls, enabled, language]);
}
