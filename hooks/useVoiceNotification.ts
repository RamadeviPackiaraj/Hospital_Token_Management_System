"use client";

import * as React from "react";
import type { ActiveCall } from "@/lib/calls";
import { buildVoiceNotificationMessage, getSpeechLanguage } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

function getVoicesForLanguage(language: string) {
  if (typeof window === "undefined") {
    return [];
  }

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase()));
}

export function useVoiceNotification(activeCalls: ActiveCall[], language: AppLanguage, enabled = true) {
  const queueRef = React.useRef<ActiveCall[]>([]);
  const announcedCallIdsRef = React.useRef<Set<string>>(new Set());
  const queuedCallIdsRef = React.useRef<Set<string>>(new Set());
  const processingRef = React.useRef(false);

  const speakCall = React.useCallback(
    (call: ActiveCall) =>
      new Promise<void>((resolve) => {
        const synth = window.speechSynthesis;
        const voices = getVoicesForLanguage(getSpeechLanguage(language));
        const utterance = new SpeechSynthesisUtterance(buildVoiceNotificationMessage(call, language));

        utterance.lang = getSpeechLanguage(language);
        utterance.rate = 1.02;
        if (voices[0]) {
          utterance.voice = voices[0];
        }

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        utterance.onend = finish;
        utterance.onerror = finish;

        synth.speak(utterance);

        const fallbackMs = Math.max(4000, utterance.text.length * 120);
        window.setTimeout(finish, fallbackMs);
      }),
    [language]
  );

  const processQueue = React.useCallback(async () => {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    try {
      while (queueRef.current.length > 0) {
        const nextCall = queueRef.current.shift();
        if (!nextCall) {
          continue;
        }

        queuedCallIdsRef.current.delete(nextCall.id);
        await speakCall(nextCall);
      }
    } finally {
      processingRef.current = false;
    }
  }, [enabled, speakCall]);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const activeCallIds = new Set(activeCalls.map((call) => call.id));

    announcedCallIdsRef.current = new Set(
      Array.from(announcedCallIdsRef.current).filter((callId) => activeCallIds.has(callId))
    );
    queueRef.current = queueRef.current.filter((call) => activeCallIds.has(call.id));
    queuedCallIdsRef.current = new Set(queueRef.current.map((call) => call.id));

    activeCalls.forEach((call) => {
      if (announcedCallIdsRef.current.has(call.id) || queuedCallIdsRef.current.has(call.id)) {
        return;
      }

      queueRef.current.push(call);
      announcedCallIdsRef.current.add(call.id);
      queuedCallIdsRef.current.add(call.id);
    });

    void processQueue();
  }, [activeCalls, enabled, processQueue]);

  React.useEffect(() => {
    return () => {
      processingRef.current = false;
      queueRef.current = [];
      announcedCallIdsRef.current.clear();
      queuedCallIdsRef.current.clear();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
}
