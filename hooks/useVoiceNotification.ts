"use client";

import * as React from "react";
import { generateTextAnnouncement, type AnnouncementLanguage } from "@/lib/announcement-api";
import { playAudio } from "@/lib/audioPlayer";
import type { ActiveCall } from "@/lib/calls";
import { buildVoiceNotificationMessage, getSpeechLanguage } from "@/lib/calls";
import type { AppLanguage } from "@/lib/i18n";

const ANNOUNCEMENT_GAP_MS = 900;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getVoicesForLanguage(language: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase()));
}

function toAnnouncementLanguage(language: AppLanguage): AnnouncementLanguage {
  if (language === "ta" || language === "hi" || language === "ml") {
    return language;
  }

  return "en";
}

export function useVoiceNotification(activeCalls: ActiveCall[], language: AppLanguage, enabled = true) {
  const activeCallsRef = React.useRef<ActiveCall[]>(activeCalls);
  const enabledRef = React.useRef(enabled);
  const languageRef = React.useRef(language);
  const processingRef = React.useRef(false);
  const activeAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  React.useEffect(() => {
    activeCallsRef.current = activeCalls;
  }, [activeCalls]);

  React.useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  React.useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const playBrowserSpeech = React.useCallback(async (message: string, currentLanguage: AppLanguage) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const synth = window.speechSynthesis;
      const speechLanguage = getSpeechLanguage(currentLanguage);
      const voices = getVoicesForLanguage(speechLanguage);
      const utterance = new SpeechSynthesisUtterance(message);

      utterance.lang = speechLanguage;
      utterance.rate = 1.02;
      if (voices[0]) {
        utterance.voice = voices[0];
      }

      let settled = false;
      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);

      try {
        synth.speak(utterance);
        window.setTimeout(() => finish(true), Math.max(4000, utterance.text.length * 120));
      } catch (error) {
        console.error("[Calls Voice Alert] Browser speech synthesis failed.", error);
        finish(false);
      }
    });
  }, []);

  const speakCall = React.useCallback(
    async (call: ActiveCall) => {
      const currentLanguage = languageRef.current;
      const message = buildVoiceNotificationMessage(call, currentLanguage);

      setIsSpeaking(true);

      try {
        const result = await generateTextAnnouncement({
          text: message,
          language: toAnnouncementLanguage(currentLanguage),
          gender: "female",
        });

        if (result.audioUrl) {
          const played = await playAudio(result.audioUrl, {
            volume: 1,
            onAudioCreated: (audio) => {
              activeAudioRef.current = audio;
            },
          });

          if (played) {
            return;
          }
        }

        const browserSpoken = await playBrowserSpeech(message, currentLanguage);
        if (!browserSpoken) {
          console.warn("[Calls Voice Alert] Unable to play spoken call alert.", {
            callId: call.id,
            language: currentLanguage,
          });
        }
      } catch (error) {
        console.warn("[Calls Voice Alert] Unable to generate spoken call alert.", error);
        await playBrowserSpeech(message, currentLanguage);
      } finally {
        activeAudioRef.current = null;
        setIsSpeaking(false);
      }
    },
    [playBrowserSpeech]
  );

  const processQueue = React.useCallback(async () => {
    if (!enabledRef.current || processingRef.current) {
      return;
    }

    processingRef.current = true;

    try {
      while (enabledRef.current) {
        const nextRound = [...activeCallsRef.current].sort((left, right) => left.startedAt - right.startedAt);
        if (nextRound.length === 0) {
          break;
        }

        for (const call of nextRound) {
          if (!enabledRef.current) {
            break;
          }

          const stillActive = activeCallsRef.current.some((activeCall) => activeCall.id === call.id);
          if (!stillActive) {
            continue;
          }

          await speakCall(call);

          if (!enabledRef.current) {
            break;
          }

          if (activeCallsRef.current.length > 0) {
            await wait(ANNOUNCEMENT_GAP_MS);
          }
        }
      }
    } finally {
      setIsSpeaking(false);
      processingRef.current = false;
    }
  }, [speakCall]);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setIsSpeaking(false);
      return;
    }

    void processQueue();
  }, [activeCalls, enabled, processQueue]);

  React.useEffect(() => {
    return () => {
      enabledRef.current = false;
      activeCallsRef.current = [];
      processingRef.current = false;
      setIsSpeaking(false);

      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeaking,
  };
}
