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
import { generateAnnouncement, type AnnouncementLanguage, type GenerateAnnouncementResponse } from "@/lib/announcement-api";
import { cancelSpeechSynthesis, speakAnnouncementText, speakAnnouncementTextAsync } from "@/lib/browser-tts";
import { useI18n } from "@/components/i18n";
import { useTimer } from "@/components/tv-display";
import { playAudio } from "@/lib/audioPlayer";
import { getLanguageLabel, getStoredLanguage, type AppLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { getPatientTokens } from "@/lib/schedule-api";
import type { CloudTtsLanguage } from "@/lib/tts-api";
import type { PatientTokenRecord } from "@/lib/scheduling-types";

const ANNOUNCEMENT_SETTINGS_KEY = "hospital_tv_announcement_settings";
const ANNOUNCEMENT_REPEAT_COUNT = 2;
const ANNOUNCEMENT_REPEAT_GAP_MS = 300;

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
  payload: {
    tokenNumber: number;
    patientName: string;
    doctorName: string;
    department: string;
    language: AnnouncementLanguage;
    gender: "male" | "female";
  };
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

const LANGUAGE_OPTIONS: Array<{ languageKey: AppLanguage; value: CloudTtsLanguage }> = [
  { languageKey: "en", value: "english" },
  { languageKey: "ta", value: "tamil" },
  { languageKey: "hi", value: "hindi" },
  { languageKey: "ml", value: "malayalam" },
];

const RATE_OPTIONS: Array<{ speedKey: "slow" | "normal" | "fast" | "faster"; value: AnnouncementSettings["rate"] }> = [
  { speedKey: "slow", value: 0.75 },
  { speedKey: "normal", value: 1 },
  { speedKey: "fast", value: 1.25 },
  { speedKey: "faster", value: 1.5 },
];

const APP_LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ml: "ml-IN",
  ta: "ta-IN",
};

function getCloudLanguageLabel(language: CloudTtsLanguage, t: (key: string, options?: Record<string, unknown>) => string) {
  const option = LANGUAGE_OPTIONS.find((item) => item.value === language);
  if (!option) return getLanguageLabel("en", t);
  return getLanguageLabel(option.languageKey, t);
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

function formatDisplayDate(date: Date, language: AppLanguage) {
  return new Intl.DateTimeFormat(APP_LANGUAGE_LOCALES[language] ?? APP_LANGUAGE_LOCALES.en, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDisplayTime(date: Date, language: AppLanguage) {
  const timeString = new Intl.DateTimeFormat(APP_LANGUAGE_LOCALES[language] ?? APP_LANGUAGE_LOCALES.en, {
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

function parseTimeString(timeStr: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!timeStr) return { time: t("tvDisplay.notAvailable"), period: "" };

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

function formatDisplayTokenNumber(tokenLabel: string, tokenNumber?: number) {
  if (!tokenNumber) return `${tokenLabel} #---`;
  return `${tokenLabel} #${String(tokenNumber).padStart(3, "0")}`;
}

function normalizeDoctorName(name: string) {
  return name.replace(/^dr\.?\s*/i, "").trim();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isSupportedLanguage(value: unknown): value is CloudTtsLanguage {
  return LANGUAGE_OPTIONS.some((option) => option.value === value);
}

function mapCloudLanguageToAnnouncementLanguage(language: CloudTtsLanguage): AnnouncementLanguage {
  if (language === "tamil") return "ta";
  if (language === "hindi") return "hi";
  if (language === "malayalam") return "ml";
  return "en";
}

function mapCloudLanguageToAppLanguage(language: CloudTtsLanguage): AppLanguage {
  if (language === "tamil") return "ta";
  if (language === "hindi") return "hi";
  if (language === "malayalam") return "ml";
  return "en";
}

function mapAppLanguageToCloudLanguage(language: string): CloudTtsLanguage {
  if (language === "ta") return "tamil";
  if (language === "hi") return "hindi";
  if (language === "ml") return "malayalam";
  return "english";
}

function buildAnnouncementRequest(
  token: PatientTokenRecord,
  language: CloudTtsLanguage,
  voiceType: AnnouncementSettings["voiceType"]
): AnnouncementRequest {
  return {
    tokenId: token.id,
    payload: {
      tokenNumber: token.tokenNumber,
      patientName: token.displayPatientName || token.patientName,
      doctorName: normalizeDoctorName(token.displayDoctorName || token.doctorName),
      department: token.displayDepartment || token.department,
      language: mapCloudLanguageToAnnouncementLanguage(language),
      gender: voiceType,
    },
  };
}

function buildAnnouncementSignature(
  token: PatientTokenRecord,
  language: CloudTtsLanguage,
  voiceType: AnnouncementSettings["voiceType"]
) {
  return [
    token.id,
    token.tokenNumber,
    token.displayPatientName || token.patientName,
    token.displayDoctorName || token.doctorName,
    token.displayDepartment || token.department,
    language,
    voiceType,
  ].join("|");
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
  const { language, t } = useI18n();
  const [now, setNow] = React.useState<Date | null>(null);
  const [tokens, setTokens] = React.useState<PatientTokenRecord[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [usingMockData, setUsingMockData] = React.useState(false);
  const [demoMode, setDemoMode] = React.useState(false);
  const [liveStatus, setLiveStatus] = React.useState<LiveStatus>("loading");
  const [settings, setSettings] = React.useState<AnnouncementSettings>(DEFAULT_SETTINGS);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [currentAnnouncementResult, setCurrentAnnouncementResult] = React.useState<GenerateAnnouncementResponse | null>(null);

  const settingsRef = React.useRef<AnnouncementSettings>(DEFAULT_SETTINGS);
  const activeAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const activeAudioControllerRef = React.useRef<AbortController | null>(null);
  const announcementRunIdRef = React.useRef(0);
  const announcedTokenSignaturesRef = React.useRef<Map<string, string>>(new Map());

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
    const nextLanguage = mapAppLanguageToCloudLanguage(language);
    setSettings((current) => {
      if (current.language === nextLanguage) {
        return current;
      }

      return {
        ...current,
        language: nextLanguage,
      };
    });
  }, [language]);

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

  const stopActiveAudio = React.useCallback(() => {
    activeAudioControllerRef.current?.abort();
    activeAudioControllerRef.current = null;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
  }, []);

  const stopAllAnnouncementPlayback = React.useCallback(() => {
    stopActiveAudio();
    cancelSpeechSynthesis();
  }, [stopActiveAudio]);

  const playAnnouncementAudio = React.useCallback(
    async (audioUrl: string, immediate = false) => {
      const currentSettings = settingsRef.current;

      if (!audioUrl || currentSettings.muted) {
        return false;
      }

      stopActiveAudio();

      if (!immediate && currentSettings.delayMs > 0) {
        await wait(currentSettings.delayMs);
      }

      const controller = new AbortController();
      activeAudioControllerRef.current = controller;

      const result = await playAudio(audioUrl, {
        volume: currentSettings.volume,
        signal: controller.signal,
        onAudioCreated: (audio) => {
          activeAudioRef.current = audio;
        },
      });

      if (activeAudioControllerRef.current === controller) {
        activeAudioControllerRef.current = null;
      }

      return result;
    },
    [stopActiveAudio]
  );

  const speakAnnouncementFallback = React.useCallback(
    (text: string) => {
      return speakAnnouncementText({
        text,
        language: mapCloudLanguageToAppLanguage(settingsRef.current.language),
        rate: settingsRef.current.rate,
        gender: settingsRef.current.voiceType,
      });
    },
    []
  );

  const speakAnnouncementFallbackAsync = React.useCallback(
    async (text: string) => {
      return speakAnnouncementTextAsync({
        text,
        language: mapCloudLanguageToAppLanguage(settingsRef.current.language),
        rate: settingsRef.current.rate,
        gender: settingsRef.current.voiceType,
      });
    },
    []
  );

  React.useEffect(() => {
    if (settings.muted) {
      announcementRunIdRef.current += 1;
      stopAllAnnouncementPlayback();
    }
  }, [settings.muted, stopAllAnnouncementPlayback]);

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
      announcementRunIdRef.current += 1;
      stopAllAnnouncementPlayback();
    };
  }, [stopAllAnnouncementPlayback]);

  const displayTokens = React.useMemo(() => {
    if (tokens.length === 0) {
      return [];
    }

    return usingMockData ? applySimulation(tokens, activeIndex) : tokens;
  }, [activeIndex, tokens, usingMockData]);

  const activeCallingTokens = React.useMemo(
    () => displayTokens.filter((token) => token.status === "CALLING"),
    [displayTokens]
  );

  const currentToken = React.useMemo(
    () => activeCallingTokens[0] ?? null,
    [activeCallingTokens]
  );

  React.useEffect(() => {
    if (currentToken?.status === "CALLING") {
      return;
    }

    setCurrentAnnouncementResult(null);
  }, [currentToken]);

  React.useEffect(() => {
    if (activeCallingTokens.length === 0) {
      setCurrentAnnouncementResult(null);
      return;
    }

    if (settings.muted) {
      return;
    }

    const runId = announcementRunIdRef.current + 1;
    announcementRunIdRef.current = runId;

    const activeTokenIds = new Set(activeCallingTokens.map((token) => token.id));
    for (const tokenId of announcedTokenSignaturesRef.current.keys()) {
      if (!activeTokenIds.has(tokenId)) {
        announcedTokenSignaturesRef.current.delete(tokenId);
      }
    }

    async function runAnnouncements() {
      const tokensToAnnounce = activeCallingTokens.filter((token) => {
        const signature = buildAnnouncementSignature(
          token,
          settingsRef.current.language,
          settingsRef.current.voiceType
        );

        return announcedTokenSignaturesRef.current.get(token.id) !== signature;
      });

      for (const token of tokensToAnnounce) {
        if (announcementRunIdRef.current !== runId) return;

        const announcementRequest = buildAnnouncementRequest(
          token,
          settingsRef.current.language,
          settingsRef.current.voiceType
        );
        const fallbackText = `Token number ${announcementRequest.payload.tokenNumber} Patient ${announcementRequest.payload.patientName}, please go to Dr. ${announcementRequest.payload.doctorName} in the ${announcementRequest.payload.department} department.`;
        const signature = buildAnnouncementSignature(
          token,
          settingsRef.current.language,
          settingsRef.current.voiceType
        );

        try {
          const result = await generateAnnouncement(announcementRequest.payload);
          if (announcementRunIdRef.current !== runId) return;

          setCurrentAnnouncementResult(result);

          if (!settingsRef.current.muted) {
            for (let repeatIndex = 0; repeatIndex < ANNOUNCEMENT_REPEAT_COUNT; repeatIndex += 1) {
              if (announcementRunIdRef.current !== runId) return;

              const played = result.audioUrl ? await playAnnouncementAudio(result.audioUrl, true) : false;
              if (!played) {
                await speakAnnouncementFallbackAsync(result.translatedText);
              }

              if (repeatIndex < ANNOUNCEMENT_REPEAT_COUNT - 1 && announcementRunIdRef.current === runId) {
                await wait(ANNOUNCEMENT_REPEAT_GAP_MS);
              }
            }
          }

          announcedTokenSignaturesRef.current.set(token.id, signature);
        } catch (error) {
          if (announcementRunIdRef.current !== runId) return;

          logger.warn("Unable to generate TV announcement", {
            source: "tv-display.announcement",
            data: { error, payload: announcementRequest.payload },
          });

          if (!settingsRef.current.muted) {
            for (let repeatIndex = 0; repeatIndex < ANNOUNCEMENT_REPEAT_COUNT; repeatIndex += 1) {
              if (announcementRunIdRef.current !== runId) return;

              await speakAnnouncementFallbackAsync(fallbackText);

              if (repeatIndex < ANNOUNCEMENT_REPEAT_COUNT - 1 && announcementRunIdRef.current === runId) {
                await wait(ANNOUNCEMENT_REPEAT_GAP_MS);
              }
            }
          }

          announcedTokenSignaturesRef.current.set(token.id, signature);
        }
      }
    }

    void runAnnouncements();

    return () => {
      announcementRunIdRef.current += 1;
      stopAllAnnouncementPlayback();
    };
  }, [activeCallingTokens, playAnnouncementAudio, settings.muted, speakAnnouncementFallbackAsync, stopAllAnnouncementPlayback]);

  const visibleTokens = React.useMemo(() => {
    return activeCallingTokens;
  }, [activeCallingTokens]);

  const { formatted } = useTimer(currentToken?.id ?? null, currentToken?.status === "CALLING");
  const displayDate = React.useMemo(() => (now ? formatDisplayDate(now, language) : "-- --- ----"), [language, now]);
  const displayClock = React.useMemo(
    () => (now ? formatDisplayTime(now, language) : { time: "--:--:--", period: "" }),
    [language, now]
  );
  const tokenLabel = React.useMemo(() => t("patientEntry.token").toUpperCase(), [t]);
  const rateOptions = React.useMemo(
    () =>
      RATE_OPTIONS.map((option) => ({
        ...option,
        label: `${option.value}x ${t(`tvDisplay.${option.speedKey}`)}`,
      })),
    [t]
  );

  const replayLastAnnouncement = React.useCallback(() => {
    if (!currentAnnouncementResult) return;
    if (currentAnnouncementResult.audioUrl) {
      void playAnnouncementAudio(currentAnnouncementResult.audioUrl, true).then((played) => {
        if (!played) {
          speakAnnouncementFallback(currentAnnouncementResult.translatedText);
        }
      });
      return;
    }

    speakAnnouncementFallback(currentAnnouncementResult.translatedText);
  }, [currentAnnouncementResult, playAnnouncementAudio, speakAnnouncementFallback]);

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
                title={showSettings ? t("tvDisplay.hideSettings") : t("tvDisplay.showSettings")}
                aria-label={showSettings ? t("tvDisplay.hideSettings") : t("tvDisplay.showSettings")}
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
                disabled={!currentAnnouncementResult}
                title={t("tvDisplay.repeatAnnouncement")}
                aria-label={t("tvDisplay.repeatAnnouncement")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#0EA5A4] bg-[#F0FDFA] text-[#0F766E] transition hover:bg-[#CCFBF1] disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => updateSetting("muted", !settings.muted)}
                title={settings.muted ? t("tvDisplay.unmuteVoice") : t("tvDisplay.muteVoice")}
                aria-label={settings.muted ? t("tvDisplay.unmuteVoice") : t("tvDisplay.muteVoice")}
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
                title={isFullscreen ? t("tvDisplay.exitFullscreen") : t("tvDisplay.fullscreen")}
                aria-label={isFullscreen ? t("tvDisplay.exitFullscreen") : t("tvDisplay.fullscreen")}
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
                <label className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">{t("tvDisplay.voiceType")}</span>
                  <select
                    value={settings.voiceType}
                    onChange={(event) => updateSetting("voiceType", event.target.value as AnnouncementSettings["voiceType"])}
                    className="mt-4 h-[58px] w-full rounded-[16px] border border-[#CBD5E1] bg-white px-5 text-[15px] font-semibold text-[#0F172A] outline-none transition focus:border-[#0EA5A4]"
                  >
                    <option value="male">{t("tvDisplay.male")}</option>
                    <option value="female">{t("tvDisplay.female")}</option>
                  </select>
                </label>

                <label className="rounded-[22px] border border-[#D9E3F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">{t("tvDisplay.speechSpeed")}</span>
                  </div>
                  <select
                    value={settings.rate}
                    onChange={(event) => updateSetting("rate", Number(event.target.value) as AnnouncementSettings["rate"])}
                    className="mt-4 h-[58px] w-full rounded-[16px] border border-[#CBD5E1] bg-white px-5 text-[15px] font-semibold text-[#0F172A] outline-none transition focus:border-[#0EA5A4]"
                  >
                    {rateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">{t("tvDisplay.volume")}</span>
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
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">{t("tvDisplay.delay")}</span>
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

              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 md:p-6">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <CalendarDays className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">{t("common.date")}</p>
              </div>
              <p className="mt-4 text-[32px] font-medium leading-10 text-[#0F172A]">{displayDate}</p>
            </div>

            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 md:p-6">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <Clock3 className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">{t("common.time")}</p>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <p className="text-[32px] font-medium leading-10 text-[#0F172A]">{displayClock.time}</p>
                <span className="text-[16px] font-semibold leading-6 text-[#0EA5A4]">{displayClock.period}</span>
              </div>
            </div>

            <div className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 md:col-span-2 md:p-6 xl:col-span-1">
              <div className="flex items-center gap-3 text-[#0EA5A4]">
                <Clock3 className="h-6 w-6" />
                <p className="text-[14px] font-medium leading-5 text-[#64748B]">{t("tvDisplay.callDuration")}</p>
              </div>
              <p className="mt-4 text-[32px] font-medium leading-10 text-[#0F172A]">{formatted}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#E2E8F0] bg-[#FFFFFF] shadow-panel">
          <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#7B8BA4]">Announcement</p>
            <p className="mt-3 text-[24px] font-semibold leading-9 text-[#0F172A]">
              {currentAnnouncementResult?.translatedText || "Waiting for the next announcement."}
            </p>
          </div>
          <div className="overflow-hidden rounded-[18px]">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">{t("tvDisplay.patientName")}</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">{t("tvDisplay.doctor")}</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">{t("tvDisplay.department")}</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">{t("tvDisplay.contact")}</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">{t("tvDisplay.visitDate")}</th>
                    <th className="px-6 py-4 text-left text-[16px] font-semibold text-[#0F172A]">{t("tvDisplay.scheduledTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTokens.length > 0 ? (
                    visibleTokens.map((token) => {
                      const rowTime = parseTimeString(token?.time, t);
                      const isCurrentAnnouncementToken = token.id === currentToken?.id;

                      return (
                        <tr
                          key={token.id}
                          className={`border-b border-[#E2E8F0] ${isCurrentAnnouncementToken ? "bg-[#F0FDFA]" : "bg-white"}`}
                        >
                          <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                            {token.displayPatientName || token.patientName || t("tvDisplay.waitingForNextPatient")}
                          </td>
                          <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                            {`Dr. ${normalizeDoctorName(token.displayDoctorName || token.doctorName)}`}
                          </td>
                          <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                            {token.displayDepartment || token.department || t("tvDisplay.notAvailable")}
                          </td>
                          <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                            {token.contact ?? t("tvDisplay.notAvailable")}
                          </td>
                          <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                            {token.date ?? displayDate}
                          </td>
                          <td className="px-6 py-5 text-[18px] font-normal text-[#0F172A]">
                            <div className="flex items-baseline gap-2">
                              <span>{rowTime.time}</span>
                              {rowTime.period ? (
                                <span className="text-[14px] font-semibold text-[#0EA5A4]">
                                  {rowTime.period}
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-b border-[#E2E8F0]">
                      <td colSpan={6} className="px-6 py-5 text-center text-[18px] font-normal text-[#64748B]">
                        {t("tvDisplay.waitingForNextPatient")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

