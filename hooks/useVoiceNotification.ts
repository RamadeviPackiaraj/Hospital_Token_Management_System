"use client";

import * as React from "react";
import type { ActiveCall } from "@/lib/calls";
import { buildVoiceNotificationMessage, getSpeechLanguage } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

const ANNOUNCED_CALLS_KEY = "call-voice-announcements";

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

    const spokenIds = new Set<string>(JSON.parse(window.sessionStorage.getItem(ANNOUNCED_CALLS_KEY) || "[]"));
    const nextCalls = activeCalls.filter((call) => !spokenIds.has(call.id));
    if (!nextCalls.length) {
      return;
    }

    const speak = () => {
      const voices = getVoicesForLanguage(getSpeechLanguage(language));

      nextCalls.forEach((call) => {
        const utterance = new SpeechSynthesisUtterance(buildVoiceNotificationMessage(call, language));
        utterance.lang = getSpeechLanguage(language);
        utterance.rate = 1;
        if (voices[0]) {
          utterance.voice = voices[0];
        }
        window.speechSynthesis.speak(utterance);
        spokenIds.add(call.id);
      });

      window.sessionStorage.setItem(ANNOUNCED_CALLS_KEY, JSON.stringify(Array.from(spokenIds)));
    };

    if (window.speechSynthesis.getVoices().length) {
      speak();
      return;
    }

    window.speechSynthesis.onvoiceschanged = speak;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [activeCalls, enabled, language]);
}
