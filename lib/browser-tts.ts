"use client";

import { DEFAULT_LANGUAGE, getStoredLanguage, type AppLanguage } from "@/lib/i18n";

const SPEECH_LANG: Record<AppLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ml: "ml-IN",
  ta: "ta-IN",
};

const GENDER_VOICE_HINTS: Record<"male" | "female", string[]> = {
  male: ["male", "man", "guy", "david", "mark", "prabhat", "valluvar", "madhur", "midhun"],
  female: ["female", "woman", "girl", "zira", "hazel", "heera", "neerja", "pallavi", "swara", "sobhana"],
};

function getVoicesForLanguage(language: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase()));
}

function pickVoice(language: AppLanguage, gender: "male" | "female") {
  const languageCode = SPEECH_LANG[language] || SPEECH_LANG[DEFAULT_LANGUAGE];
  const voices = getVoicesForLanguage(languageCode);
  if (voices.length === 0) {
    return null;
  }

  const hints = GENDER_VOICE_HINTS[gender];
  const matchedVoice = voices.find((voice) => {
    const descriptor = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    return hints.some((hint) => descriptor.includes(hint));
  });

  return matchedVoice || voices[0];
}

export function cancelSpeechSynthesis() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
}

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

  cancelSpeechSynthesis();
  window.speechSynthesis.speak(utterance);
}

export function speakAnnouncementText({
  text,
  language = getStoredLanguage(),
  rate = 0.95,
  gender = "male",
}: {
  text: string;
  language?: AppLanguage;
  rate?: number;
  gender?: "male" | "female";
}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const message = String(text || "").trim();
  if (!message) {
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = SPEECH_LANG[language] || SPEECH_LANG[DEFAULT_LANGUAGE];
  utterance.rate = rate;
  utterance.pitch = 1;
  const voice = pickVoice(language, gender);
  if (voice) {
    utterance.voice = voice;
  }

  cancelSpeechSynthesis();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function speakAnnouncementTextAsync({
  text,
  language = getStoredLanguage(),
  rate = 0.95,
  gender = "male",
}: {
  text: string;
  language?: AppLanguage;
  rate?: number;
  gender?: "male" | "female";
}) {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve(false);
      return;
    }

    const message = String(text || "").trim();
    if (!message) {
      resolve(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = SPEECH_LANG[language] || SPEECH_LANG[DEFAULT_LANGUAGE];
    utterance.rate = rate;
    utterance.pitch = 1;
    const voice = pickVoice(language, gender);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);

    cancelSpeechSynthesis();
    window.speechSynthesis.speak(utterance);
  });
}
