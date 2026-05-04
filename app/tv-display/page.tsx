"use client";

import * as React from "react";
import {
  CalendarDays,
  Clock3,
  Maximize,
  Minimize,
  RotateCcw,
  Settings2,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { useTimer } from "@/components/tv-display";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import { getStoredLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { getPatientTokens } from "@/lib/schedule-api";
import type { CloudTtsLanguage } from "@/lib/tts-api";
import type { PatientTokenRecord } from "@/lib/scheduling-types";

const ANNOUNCEMENT_SETTINGS_KEY = "hospital_tv_announcement_settings";

type AnnouncementSettings = {
  voiceType: "male" | "female";
  language: CloudTtsLanguage;
  rate: 0.75 | 1 | 1.25 | 1.5;
  muted: boolean;
  volume: number;
  delayMs: number;
};

type AnnouncementRequest = {
  tokenId: string;
  tokenNumber: number;
  language: CloudTtsLanguage;
  voiceType: AnnouncementSettings["voiceType"];
};

type LiveStatus = "loading" | "ready" | "empty" | "error";

const DEFAULT_SETTINGS: AnnouncementSettings = {
  voiceType: "male",
  language: "english",
  rate: 1,
  muted: false,
  volume: 1,
  delayMs: 2000,
};

const LANGUAGE_OPTIONS: Array<{ label: string; value: CloudTtsLanguage }> = [
  { label: "English", value: "english" },
  { label: "Tamil", value: "tamil" },
  { label: "Hindi", value: "hindi" },
  { label: "Telugu", value: "telugu" },
  { label: "Malayalam", value: "malayalam" },
  { label: "Kannada", value: "kannada" },
];

const RATE_OPTIONS: Array<{ label: string; value: AnnouncementSettings["rate"] }> = [
  { label: "0.75x Slow", value: 0.75 },
  { label: "1x Normal", value: 1 },
  { label: "1.25x Fast", value: 1.25 },
  { label: "1.5x Faster", value: 1.5 },
];

function getVoiceEngineLabel() {
  return "Cloud TTS Engine";
}

function getVoiceEngineDescription(language: CloudTtsLanguage) {
  const languageLabel = LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? "English";
  return `${languageLabel} cloud announcement voice`;
}

const MOCK_TOKENS: PatientTokenRecord[] = [
  {
    id: "tv-token-1",
    tokenNumber: 1,
    patientName: "Asha Patel",
    dob: "1988-03-14",
    bloodGroup: "B+",
    aadhaar: "",
    contact: "9999999991",
    department: "Cardiology",
    doctorName: "Rohan Mehta",
    date: "2026-04-17",
    time: "09:00 AM",
    status: "CALLING",
    createdAt: "2026-04-17T09:00:00.000Z",
  },
  {
    id: "tv-token-2",
    tokenNumber: 2,
    patientName: "Priya Nair",
    dob: "1994-07-22",
    bloodGroup: "A+",
    aadhaar: "",
    contact: "9999999992",
    department: "Orthopedics",
    doctorName: "Anil Kumar",
    date: "2026-04-17",
    time: "09:15 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T09:15:00.000Z",
  },
  {
    id: "tv-token-3",
    tokenNumber: 3,
    patientName: "Vikram Singh",
    dob: "1979-11-08",
    bloodGroup: "O+",
    aadhaar: "",
    contact: "9999999993",
    department: "Neurology",
    doctorName: "Meera Joseph",
    date: "2026-04-17",
    time: "09:30 AM",
    status: "NOT_STARTED",
    createdAt: "2026-04-17T09:30:00.000Z",
  },
];

function getTodayDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sortTokens(tokens: PatientTokenRecord[]) {
  return [...tokens].sort((left, right) => left.tokenNumber - right.tokenNumber);
}

function applySimulation(tokens: PatientTokenRecord[], activeIndex: number) {
  return tokens.map((token, index) => {
    let status: PatientTokenRecord["status"] = "NOT_STARTED";

    if (index < activeIndex) {
      status = "COMPLETED";
    } else if (index === activeIndex) {
      status = "CALLING";
    }

    return {
      ...token,
      status,
    };
  });
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDisplayTime(date: Date) {
  const timeString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);

  const parts = timeString.split(" ");
  return {
    time: parts[0] || "--:--:--",
    period: parts[1] || "",
  };
}

function parseTimeString(timeStr: string | undefined) {
  if (!timeStr) return { time: "Not available", period: "" };

  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const parts = timeStr.split(" ");
    return { time: parts[0], period: parts[1] || "" };
  }

  const timeParts = timeStr.split(":");
  if (timeParts.length >= 2) {
    let hours = Number.parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const period = hours >= 12 ? "PM" : "AM";

    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    return { time: `${hours}:${minutes}`, period };
  }

  return { time: timeStr, period: "" };
}

function formatDisplayTokenNumber(tokenNumber?: number) {
  if (!tokenNumber) return "TOKEN #---";
  return `TOKEN #${String(tokenNumber).padStart(3, "0")}`;
}

function normalizeDoctorName(name: string) {
  return name.replace(/^dr\.?\s*/i, "").trim();
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function escapeSsml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const DEPARTMENT_TRANSLATIONS: Record<
  Exclude<CloudTtsLanguage, "english">,
  Record<string, string>
> = {
  tamil: {
    ent: "\u0b95\u0bbe\u0ba4\u0bc1 \u0bae\u0bc2\u0b95\u0bcd\u0b95\u0bc1 \u0ba4\u0bca\u0ba3\u0bcd\u0b9f\u0bc8 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    cardiology: "\u0b87\u0ba4\u0baf \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    orthopedics: "\u0b8e\u0bb2\u0bc1\u0bae\u0bcd\u0baa\u0bc1 \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0bae\u0bc2\u0b9f\u0bcd\u0b9f\u0bc1 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    neurology: "\u0ba8\u0bb0\u0bae\u0bcd\u0baa\u0bbf\u0baf\u0bb2\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    pediatrics: "\u0b95\u0bc1\u0bb4\u0ba8\u0bcd\u0ba4\u0bc8\u0b95\u0bb3\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    gynecology: "\u0bae\u0b95\u0baa\u0bcd\u0baa\u0bc7\u0bb1\u0bc1 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    ophthalmology: "\u0b95\u0ba3\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    dentistry: "\u0baa\u0bb2\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    dermatology: "\u0ba4\u0bcb\u0bb2\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
    generalmedicine: "\u0baa\u0bca\u0ba4\u0bc1 \u0bae\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1\u0bb5 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
  },
  hindi: {
    ent: "\u0915\u093e\u0928 \u0928\u093e\u0915 \u0917\u0932\u093e \u0935\u093f\u092d\u093e\u0917",
    cardiology: "\u0939\u0943\u0926\u092f \u0935\u093f\u092d\u093e\u0917",
    orthopedics: "\u0939\u0921\u094d\u0921\u0940 \u0935\u093f\u092d\u093e\u0917",
    neurology: "\u0928\u0938 \u0935\u093f\u092d\u093e\u0917",
    pediatrics: "\u092c\u093e\u0932 \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
    gynecology: "\u0938\u094d\u0924\u094d\u0930\u0940 \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
    ophthalmology: "\u0928\u0947\u0924\u094d\u0930 \u0935\u093f\u092d\u093e\u0917",
    dentistry: "\u0926\u0902\u0924 \u0935\u093f\u092d\u093e\u0917",
    dermatology: "\u0924\u094d\u0935\u091a\u093e \u0935\u093f\u092d\u093e\u0917",
    generalmedicine: "\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u091a\u093f\u0915\u093f\u0924\u094d\u0938\u093e \u0935\u093f\u092d\u093e\u0917",
  },
  telugu: {
    ent: "\u0c1a\u0c46\u0c35\u0c3f \u0c2e\u0c41\u0c15\u0c4d\u0c15\u0c41 \u0c17\u0c4a\u0c02\u0c24\u0c41 \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    cardiology: "\u0c39\u0c43\u0c26\u0c2f \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    orthopedics: "\u0c06\u0c38\u0c4d\u0c25\u0c3f \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    neurology: "\u0c28\u0c3e\u0c21\u0c40 \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    pediatrics: "\u0c2a\u0c3f\u0c32\u0c4d\u0c32\u0c32 \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    gynecology: "\u0c38\u0c4d\u0c24\u0c4d\u0c30\u0c40 \u0c30\u0c4b\u0c17 \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    ophthalmology: "\u0c15\u0c02\u0c1f\u0c3f \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    dentistry: "\u0c26\u0c02\u0c24 \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    dermatology: "\u0c1a\u0c30\u0c4d\u0c2e \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
    generalmedicine: "\u0c38\u0c3e\u0c27\u0c3e\u0c30\u0c23 \u0c35\u0c48\u0c26\u0c4d\u0c2f \u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
  },
  malayalam: {
    ent: "\u0d15\u0d3e\u0d24\u0d4d \u0d2e\u0d42\u0d15\u0d4d\u0d15\u0d4d \u0d24\u0d4a\u0d23\u0d4d\u0d1f \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    cardiology: "\u0d39\u0d43\u0d26\u0d2f \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    orthopedics: "\u0d05\u0d38\u0d4d\u0d25\u0d3f \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    neurology: "\u0d28\u0d3e\u0d21\u0d40 \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    pediatrics: "\u0d15\u0d41\u0d1f\u0d4d\u0d1f\u0d3f\u0d15\u0d33\u0d41\u0d1f\u0d46 \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    gynecology: "\u0d38\u0d4d\u0d24\u0d4d\u0d30\u0d40 \u0d30\u0d4b\u0d17 \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    ophthalmology: "\u0d15\u0d23\u0d4d\u0d23\u0d4d \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    dentistry: "\u0d2a\u0d32\u0d4d \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    dermatology: "\u0d1a\u0d7c\u0d2e \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    generalmedicine: "\u0d2a\u0d4a\u0d24\u0d41 \u0d35\u0d48\u0d26\u0d4d\u0d2f \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
  },
  kannada: {
    ent: "\u0c95\u0cbf\u0cb5\u0cbf \u0cae\u0cc2\u0c97\u0cc1 \u0c97\u0ca4\u0ccd\u0ca4\u0cbf\u0c97\u0cc6 \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    cardiology: "\u0cb9\u0cc3\u0ca6\u0caf \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    orthopedics: "\u0caf\u0cb8\u0ccd\u0ca5\u0cbf \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    neurology: "\u0ca8\u0cbe\u0ca1\u0cc0 \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    pediatrics: "\u0cae\u0c95\u0ccd\u0c95\u0cb3 \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    gynecology: "\u0cb8\u0ccd\u0ca4\u0ccd\u0cb0\u0cc0 \u0cb0\u0ccb\u0c97 \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    ophthalmology: "\u0c95\u0ca3\u0ccd\u0ca3\u0cc1 \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    dentistry: "\u0ca6\u0c82\u0ca4 \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    dermatology: "\u0c9a\u0cb0\u0ccd\u0cae \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
    generalmedicine: "\u0cb8\u0cbe\u0cae\u0cbe\u0ca8\u0ccd\u0caf \u0cb5\u0cc8\u0ca6\u0ccd\u0caf \u0cb5\u0cbf\u0cad\u0cbe\u0c97",
  },
};

function normalizeDepartmentKey(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function getLocalizedDepartment(language: Exclude<CloudTtsLanguage, "english">, department: string) {
  const normalizedKey = normalizeDepartmentKey(department);
  return DEPARTMENT_TRANSLATIONS[language][normalizedKey] || null;
}

function buildAnnouncementText(token: PatientTokenRecord, language: CloudTtsLanguage) {
  const patientName = escapeSsml(token.displayPatientName || token.patientName);
  const doctorName = escapeSsml(normalizeDoctorName(token.displayDoctorName || token.doctorName));
  const department = escapeSsml(token.displayDepartment || token.department);
  const tokenNumber = String(token.tokenNumber);

  if (language === "english") {
    return `<speak>Token number <say-as interpret-as="cardinal">${tokenNumber}</say-as>, <break time="300ms"/><lang xml:lang="en-IN">${patientName}</lang>, <break time="300ms"/>please proceed to Doctor <lang xml:lang="en-IN">${doctorName}</lang>, <break time="300ms"/><lang xml:lang="en-IN">${department}</lang>.</speak>`;
  }

  const templates: Record<
    Exclude<CloudTtsLanguage, "english">,
    { locale: string; tokenLine: string; doctorLine: string; departmentLead: string; fallbackEndLine: string }
  > = {
    tamil: {
      locale: "ta-IN",
      tokenLine: `\u0b9f\u0bcb\u0b95\u0bcd\u0b95\u0ba9\u0bcd \u0b8e\u0ba3\u0bcd ${tokenNumber}`,
      doctorLine: "\u0ba4\u0baf\u0bb5\u0bc1\u0b9a\u0bc6\u0baf\u0bcd\u0ba4\u0bc1 \u0b9f\u0bbe\u0b95\u0bcd\u0b9f\u0bb0\u0bcd",
      departmentLead: "\u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      fallbackEndLine: "\u0b85\u0b99\u0bcd\u0b95\u0bc1 \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bb5\u0bc1\u0bae\u0bcd.",
    },
    hindi: {
      locale: "hi-IN",
      tokenLine: `\u091f\u094b\u0915\u0928 \u0928\u0902\u092c\u0930 ${tokenNumber}`,
      doctorLine: "\u0915\u0943\u092a\u092f\u093e \u0921\u0949\u0915\u094d\u091f\u0930",
      departmentLead: "\u0935\u093f\u092d\u093e\u0917",
      fallbackEndLine: "\u0915\u0947 \u092a\u093e\u0938 \u091c\u093e\u090f\u0901\u0964",
    },
    telugu: {
      locale: "te-IN",
      tokenLine: `\u0c1f\u0c4b\u0c15\u0c46\u0c28\u0c4d \u0c28\u0c02\u0c2c\u0c30\u0c4d ${tokenNumber}`,
      doctorLine: "\u0c26\u0c2f\u0c1a\u0c47\u0c38\u0c3f \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d",
      departmentLead: "\u0c35\u0c3f\u0c2d\u0c3e\u0c17\u0c02",
      fallbackEndLine: "\u0c35\u0c26\u0c4d\u0c26\u0c15\u0c41 \u0c35\u0c46\u0c33\u0c4d\u0c33\u0c02\u0c21\u0c3f.",
    },
    malayalam: {
      locale: "ml-IN",
      tokenLine: `\u0d1f\u0d4b\u0d15\u0d4d\u0d15\u0d7a \u0d28\u0d2e\u0d4d\u0d2a\u0d7c ${tokenNumber}`,
      doctorLine: "\u0d26\u0d2f\u0d35\u0d3e\u0d2f\u0d3f \u0d21\u0d4b\u0d15\u0d4d\u0d1f\u0d7c",
      departmentLead: "\u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
      fallbackEndLine: "\u0d35\u0d3f\u0d1f\u0d4d\u0d1f\u0d3f\u0d32\u0d47\u0d15\u0d4d\u0d15\u0d4d \u0d2a\u0d4b\u0d15\u0d41\u0d15.",
    },
    kannada: {
      locale: "kn-IN",
      tokenLine: `\u0c9f\u0ccb\u0c95\u0ca8\u0ccd \u0cb8\u0c82\u0c96\u0ccd\u0caf\u0cc6 ${tokenNumber}`,
      doctorLine: "\u0ca6\u0caf\u0cb5\u0cbf\u0c9f\u0ccd\u0c9f\u0cc1 \u0ca1\u0cbe\u0c95\u0ccd\u0c9f\u0cb0\u0ccd",
      departmentLead: "\u0cb5\u0cbf\u0cad\u0cbe\u0c97",
      fallbackEndLine: "\u0cb5\u0ca6\u0ccd\u0ca6\u0c95\u0ccd\u0c95\u0cc6 \u0cb9\u0ccb\u0c97\u0cbf.",
    },
  };

  const template = templates[language];
  const localizedDepartment = getLocalizedDepartment(language, token.displayDepartment || token.department);
  const departmentLine = localizedDepartment
    ? `<lang xml:lang="${template.locale}">${escapeSsml(localizedDepartment)}</lang> <lang xml:lang="${template.locale}">${escapeSsml(
        template.departmentLead
      )}</lang>`
    : `<lang xml:lang="${template.locale}">${escapeSsml(template.fallbackEndLine)}</lang>`;

  return `<speak><lang xml:lang="${template.locale}">${escapeSsml(
    template.tokenLine
  )}</lang><break time="300ms"/><lang xml:lang="en-IN">${patientName}</lang><break time="300ms"/><lang xml:lang="${template.locale}">${escapeSsml(
    template.doctorLine
  )}</lang> <lang xml:lang="en-IN">${doctorName}</lang><break time="300ms"/>${departmentLine}</speak>`;
}

function buildAnnouncementRequest(
  token: PatientTokenRecord,
  language: CloudTtsLanguage,
  voiceType: AnnouncementSettings["voiceType"]
): AnnouncementRequest {
  return {
    tokenId: token.id,
    tokenNumber: token.tokenNumber,
    language,
    voiceType,
  };
}

function isSupportedLanguage(value: unknown): value is CloudTtsLanguage {
  return LANGUAGE_OPTIONS.some((option) => option.value === value);
}

function mapAppLanguageToCloudLanguage(language: string): CloudTtsLanguage {
  if (language === "ta") return "tamil";
  if (language === "hi") return "hindi";
  if (language === "ml") return "malayalam";
  return "english";
}

function safeLoadSettings(): AnnouncementSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const rawValue = window.localStorage.getItem(ANNOUNCEMENT_SETTINGS_KEY);
    if (!rawValue) {
      return {
        ...DEFAULT_SETTINGS,
        language: mapAppLanguageToCloudLanguage(getStoredLanguage()),
      };
    }

    const parsed = JSON.parse(rawValue) as Partial<AnnouncementSettings>;
    return {
      voiceType: parsed.voiceType === "female" ? "female" : DEFAULT_SETTINGS.voiceType,
      language: isSupportedLanguage(parsed.language) ? parsed.language : DEFAULT_SETTINGS.language,
      rate:
        parsed.rate === 0.75 || parsed.rate === 1 || parsed.rate === 1.25 || parsed.rate === 1.5
          ? parsed.rate
          : DEFAULT_SETTINGS.rate,
      muted: typeof parsed.muted === "boolean" ? parsed.muted : DEFAULT_SETTINGS.muted,
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_SETTINGS.volume,
      delayMs:
        typeof parsed.delayMs === "number"
          ? Math.min(5000, Math.max(0, parsed.delayMs))
          : DEFAULT_SETTINGS.delayMs,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function TVDisplayPage() {
  const [now, setNow] = React.useState<Date | null>(null);
  const [tokens, setTokens] = React.useState<PatientTokenRecord[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [usingMockData, setUsingMockData] = React.useState(false);
  const [demoMode, setDemoMode] = React.useState(false);
  const [liveStatus, setLiveStatus] = React.useState<LiveStatus>("loading");
  const [settings, setSettings] = React.useState<AnnouncementSettings>(DEFAULT_SETTINGS);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [lastAnnouncement, setLastAnnouncement] = React.useState<AnnouncementRequest | null>(null);

  const previousAnnouncementKeyRef = React.useRef<string | null>(null);
  const settingsRef = React.useRef<AnnouncementSettings>(DEFAULT_SETTINGS);
  const { announceToken, stop: stopActiveAudio } = useAudioQueue();

  React.useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  React.useEffect(() => {
    setNow(new Date());
    setSettings(safeLoadSettings());
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ANNOUNCEMENT_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setDemoMode(params.get("demo") === "1");
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const enqueueAnnouncement = React.useCallback(
    (announcement: AnnouncementRequest, immediate = false) => {
      const currentSettings = settingsRef.current;
      setLastAnnouncement(announcement);

      if (currentSettings.muted) {
        return Promise.resolve(false);
      }

      return announceToken(
        {
          token: announcement.tokenNumber,
          language: announcement.language,
          gender: announcement.voiceType,
        },
        {
          delayMs: immediate ? 0 : currentSettings.delayMs,
          immediate,
          volume: currentSettings.volume,
        }
      );
    },
    [announceToken]
  );

  React.useEffect(() => {
    if (settings.muted) {
      stopActiveAudio();
    }
  }, [settings.muted, stopActiveAudio]);

  React.useEffect(() => {
    if (demoMode) {
      setTokens(sortTokens(MOCK_TOKENS));
      setActiveIndex(0);
      setUsingMockData(true);
      setLiveStatus("ready");
      return;
    }

    let isMounted = true;

    async function loadTokens() {
      try {
        const liveTokens = await getPatientTokens({ date: getTodayDateKey(new Date()) });
        if (!isMounted) return;

        if (liveTokens.length === 0) {
          setTokens([]);
          setActiveIndex(0);
          setUsingMockData(false);
          setLiveStatus("empty");
          return;
        }

        const sortedTokens = sortTokens(liveTokens).slice(0, 10);
        const currentLiveIndex = Math.max(
          sortedTokens.findIndex((token) => token.status === "CALLING"),
          0
        );

        setTokens(sortedTokens);
        setActiveIndex(currentLiveIndex);
        setUsingMockData(false);
        setLiveStatus("ready");
      } catch (error) {
        if (!isMounted) return;
        logger.warn("Unable to load patient tokens for TV display", {
          source: "tv-display.tokens",
          data: { error },
        });
        setTokens([]);
        setActiveIndex(0);
        setUsingMockData(false);
        setLiveStatus("error");
      }
    }

    void loadTokens();
    const poller = window.setInterval(() => {
      void loadTokens();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(poller);
    };
  }, [demoMode]);

  React.useEffect(() => {
    if (!usingMockData || tokens.length === 0) {
      return;
    }

    const rotationTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % tokens.length);
    }, 8000);

    return () => {
      window.clearInterval(rotationTimer);
    };
  }, [tokens, usingMockData]);

  React.useEffect(() => {
    return () => {
      stopActiveAudio();
    };
  }, [stopActiveAudio]);

  const displayTokens = React.useMemo(() => {
    if (tokens.length === 0) {
      return [];
    }

    return usingMockData ? applySimulation(tokens, activeIndex) : tokens;
  }, [activeIndex, tokens, usingMockData]);

  const currentToken = React.useMemo(
    () => displayTokens.find((token) => token.status === "CALLING") || displayTokens[0] || null,
    [displayTokens]
  );

  const nextToken = React.useMemo(
    () =>
      displayTokens.find((token) => token.status === "NOT_STARTED" && token.id !== currentToken?.id) || null,
    [currentToken?.id, displayTokens]
  );

  const currentAnnouncement = React.useMemo(() => {
    if (!currentToken) return null;
    return buildAnnouncementRequest(currentToken, settings.language, settings.voiceType);
  }, [currentToken, settings.language, settings.voiceType]);

  React.useEffect(() => {
    if (!currentAnnouncement || currentToken?.status !== "CALLING") {
      return;
    }

    const announcementKey = `${currentToken.id}:${settings.language}:${settings.voiceType}`;
    if (previousAnnouncementKeyRef.current === announcementKey) {
      return;
    }

    previousAnnouncementKeyRef.current = announcementKey;
    void enqueueAnnouncement(currentAnnouncement);
  }, [currentAnnouncement, currentToken, enqueueAnnouncement, settings.language, settings.voiceType]);

  const { formatted } = useTimer(currentToken?.id ?? null, currentToken?.status === "CALLING");
  const displayDate = React.useMemo(() => (now ? formatDisplayDate(now) : "-- --- ----"), [now]);
  const displayClock = React.useMemo(
    () => (now ? formatDisplayTime(now) : { time: "--:--:--", period: "" }),
    [now]
  );

  const replayLastAnnouncement = React.useCallback(() => {
    if (!lastAnnouncement) return;
    void enqueueAnnouncement(lastAnnouncement, true);
  }, [enqueueAnnouncement, lastAnnouncement]);

  async function handleFullscreenToggle() {
    if (typeof document === "undefined") return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn("Unable to toggle fullscreen mode.", error);
    }
  }

  function updateSetting<K extends keyof AnnouncementSettings>(key: K, value: AnnouncementSettings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-5 text-[#0F172A] md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5">
        <section className="rounded-[18px] border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-panel md:p-6">
          <div className="mb-6 flex justify-end">
            <div className="flex items-center gap-2 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-2">
              <button
                type="button"
                onClick={() => setShowSettings((current) => !current)}
                title={showSettings ? "Hide settings" : "Show settings"}
                aria-label={showSettings ? "Hide settings" : "Show settings"}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  showSettings
                    ? "border-[#0EA5A4] bg-[#F0FDFA] text-[#0F766E]"
                    : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0EA5A4] hover:text-[#0F766E]"
                }`}
              >
                <Settings2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={replayLastAnnouncement}
                disabled={!lastAnnouncement}
                title="Repeat announcement"
                aria-label="Repeat announcement"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#0EA5A4] bg-[#F0FDFA] text-[#0F766E] transition hover:bg-[#CCFBF1] disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => updateSetting("muted", !settings.muted)}
                title={settings.muted ? "Unmute voice" : "Mute voice"}
                aria-label={settings.muted ? "Unmute voice" : "Mute voice"}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  settings.muted
                    ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]"
                    : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0EA5A4] hover:text-[#0F766E]"
                }`}
              >
                {settings.muted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handleFullscreenToggle}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:border-[#0EA5A4] hover:text-[#0F766E]"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div
            className={`grid overflow-hidden transition-all duration-300 ${
              showSettings ? "mb-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <label className="rounded-[22px] border border-[#D9E3F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">Voice Type</span>
                  </div>
                  <select
                    value={settings.voiceType}
                    onChange={(event) => updateSetting("voiceType", event.target.value as AnnouncementSettings["voiceType"])}
                    className="mt-4 h-[58px] w-full rounded-[16px] border border-[#CBD5E1] bg-white px-5 text-[15px] font-semibold text-[#0F172A] outline-none transition focus:border-[#0EA5A4]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>

                <label className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">Language</span>
                  <select
                    value={settings.language}
                    onChange={(event) => updateSetting("language", event.target.value as CloudTtsLanguage)}
                    className="mt-4 h-[58px] w-full rounded-[16px] border border-[#CBD5E1] bg-white px-5 text-[15px] font-semibold text-[#0F172A] outline-none transition focus:border-[#0EA5A4]"
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-[22px] border border-[#D9E3F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">Speech Speed</span>
                  </div>
                  <select
                    value={settings.rate}
                    onChange={(event) => updateSetting("rate", Number(event.target.value) as AnnouncementSettings["rate"])}
                    className="mt-4 h-[58px] w-full rounded-[16px] border border-[#CBD5E1] bg-white px-5 text-[15px] font-semibold text-[#0F172A] outline-none transition focus:border-[#0EA5A4]"
                  >
                    {RATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">Volume</span>
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.volume}
                    onChange={(event) => updateSetting("volume", Number(event.target.value))}
                    className="mt-6 h-2 w-full cursor-pointer accent-[#0EA5A4]"
                  />
                </label>

                <label className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">Delay</span>
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                      {(settings.delayMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="500"
                    value={settings.delayMs}
                    onChange={(event) => updateSetting("delayMs", Number(event.target.value))}
                    className="mt-6 h-2 w-full cursor-pointer accent-[#0EA5A4]"
                  />
                </label>

                <div className="rounded-[22px] border border-[#D9E3F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">Voice Engine</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <p className="text-[15px] font-semibold leading-6 text-[#0F172A]">{getVoiceEngineLabel()}</p>
                    <p className="text-[13px] leading-5 text-[#7B8BA4]">{getVoiceEngineDescription(settings.language)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 md:p-6">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <CalendarDays className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">Date</p>
              </div>
              <p className="mt-4 text-[32px] font-medium leading-10 text-[#0F172A]">{displayDate}</p>
            </div>

            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 md:p-6">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <Clock3 className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">Time</p>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <p className="text-[32px] font-medium leading-10 text-[#0F172A]">{displayClock.time}</p>
                <span className="text-[16px] font-semibold leading-6 text-[#0EA5A4]">{displayClock.period}</span>
              </div>
            </div>

            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 md:col-span-2 md:p-6 xl:col-span-1">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <Clock3 className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">Call Duration</p>
              </div>
              <p className="mt-4 text-[32px] font-medium leading-10 text-[#0F172A]">{formatted}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#E2E8F0] bg-[#FFFFFF] shadow-panel">
          <div className="overflow-hidden rounded-[18px]">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Patient Name</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Doctor</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Department</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Contact</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Visit Date</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Scheduled Time</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">Up Next</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E2E8F0]">
                    <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                      {currentToken?.displayPatientName || currentToken?.patientName || "Waiting for next patient"}
                    </td>
                    <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                      {currentToken ? `Dr. ${normalizeDoctorName(currentToken.displayDoctorName || currentToken.doctorName)}` : "Not available"}
                    </td>
                    <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                      {currentToken?.displayDepartment || currentToken?.department || "Not available"}
                    </td>
                    <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                      {currentToken?.contact ?? "Not available"}
                    </td>
                    <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                      {currentToken?.date ?? displayDate}
                    </td>
                    <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                      <div className="flex items-baseline gap-2">
                        <span>{parseTimeString(currentToken?.time).time}</span>
                        {parseTimeString(currentToken?.time).period ? (
                          <span className="text-[14px] font-semibold text-[#0EA5A4]">
                            {parseTimeString(currentToken?.time).period}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                      {nextToken ? `${formatDisplayTokenNumber(nextToken.tokenNumber)} - ${nextToken.displayPatientName || nextToken.patientName}` : "Queue waiting"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

