"use client";

import { DEFAULT_LANGUAGE, getStoredLanguage, type AppLanguage } from "@/lib/i18n";

const SPEECH_LANG: Record<AppLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ml: "ml-IN",
  ta: "ta-IN",
};

export function buildTokenAnnouncementMessage({
  tokenNumber,
  roomNumber,
  language = getStoredLanguage(),
}: {
  tokenNumber: number;
  roomNumber: number | string;
  language?: AppLanguage;
}) {
  switch (language) {
    case "ta":
      return `டோக்கன் ${tokenNumber}, அறை ${roomNumber}க்கு செல்லவும்`;
    case "hi":
      return `टोकन ${tokenNumber}, कृपया कमरा ${roomNumber} में जाएं`;
    case "ml":
      return `ടോക്കൺ ${tokenNumber}, ദയവായി റൂം ${roomNumber} ലേക്ക് പോകുക`;
    case "en":
    default:
      return `Token ${tokenNumber}, please go to room ${roomNumber}`;
  }
}

export function speakTokenAnnouncement({
  tokenNumber,
  roomNumber = 3,
  language = getStoredLanguage(),
}: {
  tokenNumber: number;
  roomNumber?: number | string;
  language?: AppLanguage;
}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const message = buildTokenAnnouncementMessage({
    tokenNumber,
    roomNumber,
    language,
  });
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = SPEECH_LANG[language] || SPEECH_LANG[DEFAULT_LANGUAGE];
  utterance.rate = 0.95;
  utterance.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
