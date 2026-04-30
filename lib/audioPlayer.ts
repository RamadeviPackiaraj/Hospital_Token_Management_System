import type { CloudTtsLanguage } from "@/lib/tts-api";

export const ENABLE_TTS_FALLBACK = false;

export type AudioLanguage = CloudTtsLanguage | "en" | "ta" | "hi" | "te" | "kn" | "ml";
export type AudioGender = "male" | "female";

export type AnnouncementQueueItem = {
  text: string;
  audioKey: string;
  language: AudioLanguage;
  gender: AudioGender;
};

type PlayAudioOptions = {
  volume?: number;
  signal?: AbortSignal;
  onAudioCreated?: (audio: HTMLAudioElement | null) => void;
};

type PlayAnnouncementQueueOptions = PlayAudioOptions;

const LANGUAGE_FOLDER_MAP: Record<CloudTtsLanguage, string> = {
  english: "en",
  tamil: "ta",
  hindi: "hi",
  telugu: "te",
  kannada: "kn",
  malayalam: "ml",
};

const audioExistenceCache = new Map<string, boolean>();

function debugLog(message: string, data?: unknown) {
  if (data === undefined) {
    console.info(`[Audio] ${message}`);
    return;
  }

  console.info(`[Audio] ${message}`, data);
}

function normalizeLanguage(language: AudioLanguage) {
  if (language in LANGUAGE_FOLDER_MAP) {
    return LANGUAGE_FOLDER_MAP[language as CloudTtsLanguage];
  }

  const normalized = String(language || "").trim().toLowerCase();
  return ["en", "ta", "hi", "te", "kn", "ml"].includes(normalized) ? normalized : "en";
}

function normalizeGender(gender: string) {
  return String(gender || "").trim().toLowerCase() === "female" ? "female" : "male";
}

function getAlternateGender(gender: AudioGender) {
  return gender === "female" ? "male" : "female";
}

function getTtsPayloadLanguage(language: AudioLanguage) {
  const normalizedLanguage = normalizeLanguage(language);
  return normalizedLanguage === "en"
    ? "english"
    : normalizedLanguage === "ta"
      ? "tamil"
      : normalizedLanguage === "hi"
        ? "hindi"
        : normalizedLanguage === "te"
          ? "telugu"
          : normalizedLanguage === "kn"
            ? "kannada"
            : "malayalam";
}

export function getAudioPath(language: string, gender: string, key: string) {
  return `/audio/${normalizeLanguage(language as AudioLanguage)}/${normalizeGender(gender)}/${String(key || "").trim()}.mp3`;
}

export async function checkAudioExists(url: string, signal?: AbortSignal) {
  if (!url) {
    return false;
  }

  const cached = audioExistenceCache.get(url);
  if (cached !== undefined) {
    debugLog(`Using cached audio existence for ${url}`, { exists: cached });
    return cached;
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "force-cache",
      signal,
    });
    const exists = response.ok;
    audioExistenceCache.set(url, exists);
    debugLog(`Checked audio existence for ${url}`, { exists });
    return exists;
  } catch {
    audioExistenceCache.set(url, false);
    debugLog(`Audio existence check failed for ${url}`, { exists: false });
    return false;
  }
}

async function playBlobAudio(blob: Blob, options: PlayAudioOptions = {}) {
  const objectUrl = URL.createObjectURL(blob);

  try {
    return await new Promise<boolean>((resolve) => {
      const audio = new Audio(objectUrl);
      audio.preload = "auto";
      audio.volume = Math.min(1, Math.max(0, options.volume ?? 1));
      options.onAudioCreated?.(audio);

      const handleAbort = () => {
        cleanup();
        audio.pause();
        audio.currentTime = 0;
        resolve(false);
      };

      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        if (options.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }
        options.onAudioCreated?.(null);
        URL.revokeObjectURL(objectUrl);
      };

      if (options.signal?.aborted) {
        cleanup();
        resolve(false);
        return;
      }

      options.signal?.addEventListener("abort", handleAbort, { once: true });

      audio.onended = () => {
        cleanup();
        resolve(true);
      };

      audio.onerror = () => {
        cleanup();
        resolve(false);
      };

      audio.play().catch(() => {
        cleanup();
        resolve(false);
      });
    });
  } catch {
    URL.revokeObjectURL(objectUrl);
    options.onAudioCreated?.(null);
    return false;
  }
}

async function playTtsFallback(item: AnnouncementQueueItem, options: PlayAudioOptions = {}) {
  if (!ENABLE_TTS_FALLBACK) {
    return false;
  }

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: item.text,
        language: getTtsPayloadLanguage(item.language),
        gender: normalizeGender(item.gender),
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      return false;
    }

    debugLog(`Playing TTS fallback for ${item.audioKey}`, {
      language: item.language,
      gender: item.gender,
    });
    return playBlobAudio(await response.blob(), options);
  } catch {
    return false;
  }
}

function getFallbackCandidates(item: AnnouncementQueueItem) {
  const normalizedLanguage = normalizeLanguage(item.language);
  const normalizedGender = normalizeGender(item.gender);
  const alternateGender = getAlternateGender(normalizedGender);

  return [
    getAudioPath(normalizedLanguage, normalizedGender, item.audioKey),
    getAudioPath(normalizedLanguage, alternateGender, item.audioKey),
    getAudioPath("en", "male", item.audioKey),
  ];
}

async function resolvePlayableAudioPath(item: AnnouncementQueueItem, signal?: AbortSignal) {
  const [primaryPath, alternateGenderPath, englishFallbackPath] = getFallbackCandidates(item);

  if (await checkAudioExists(primaryPath, signal)) {
    debugLog(`Using primary audio file ${primaryPath}`);
    return primaryPath;
  }

  console.warn(`Missing audio file: ${primaryPath}`);

  if (alternateGenderPath !== primaryPath && (await checkAudioExists(alternateGenderPath, signal))) {
    debugLog(`Fallback triggered: same language, other gender`, {
      from: primaryPath,
      to: alternateGenderPath,
    });
    return alternateGenderPath;
  }

  if (englishFallbackPath !== primaryPath && englishFallbackPath !== alternateGenderPath && (await checkAudioExists(englishFallbackPath, signal))) {
    debugLog(`Fallback triggered: English male`, {
      from: primaryPath,
      to: englishFallbackPath,
    });
    return englishFallbackPath;
  }

  return null;
}

export async function playAudio(url: string, options: PlayAudioOptions = {}) {
  try {
    if (!url || options.signal?.aborted) {
      return false;
    }

    const exists = await checkAudioExists(url, options.signal);
    if (!exists) {
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.volume = Math.min(1, Math.max(0, options.volume ?? 1));
      options.onAudioCreated?.(audio);
      debugLog(`Playing audio file ${url}`);

      const handleAbort = () => {
        cleanup();
        audio.pause();
        audio.currentTime = 0;
        resolve(false);
      };

      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        if (options.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }
        options.onAudioCreated?.(null);
      };

      if (options.signal?.aborted) {
        cleanup();
        resolve(false);
        return;
      }

      options.signal?.addEventListener("abort", handleAbort, { once: true });

      audio.onended = () => {
        cleanup();
        resolve(true);
      };

      audio.onerror = () => {
        cleanup();
        resolve(false);
      };

      audio.play().catch(() => {
        cleanup();
        resolve(false);
      });
    });
  } catch {
    options.onAudioCreated?.(null);
    return false;
  }
}

export async function playSequence(files: string[], options: PlayAudioOptions = {}) {
  for (const file of files) {
    if (options.signal?.aborted) {
      return false;
    }

    await playAudio(file, options);
  }

  return true;
}

export async function playAnnouncementQueue(queue: AnnouncementQueueItem[], options: PlayAnnouncementQueueOptions = {}) {
  for (const item of queue) {
    if (options.signal?.aborted) {
      return false;
    }

    const resolvedPath = await resolvePlayableAudioPath(item, options.signal);
    if (resolvedPath) {
      await playAudio(resolvedPath, options);
      continue;
    }

    console.warn(`Missing audio file: ${getAudioPath(item.language, item.gender, item.audioKey)}`);

    if (ENABLE_TTS_FALLBACK) {
      await playTtsFallback(item, options);
    }
  }

  return true;
}

export function getAudioSequence(input: {
  token: number | string;
  language: AudioLanguage;
  gender: AudioGender;
}) {
  const tokenNumber = Number.parseInt(String(input.token), 10);
  const normalizedToken = Number.isFinite(tokenNumber) && tokenNumber > 0 ? String(tokenNumber) : "";

  return [
    getAudioPath(input.language, input.gender, "token_number"),
    normalizedToken ? getAudioPath(input.language, input.gender, normalizedToken) : "",
    getAudioPath(input.language, input.gender, "please_go"),
  ].filter(Boolean);
}

export function buildTokenAnnouncementQueue(input: {
  token: number | string;
  language: AudioLanguage;
  gender: AudioGender;
}) {
  const tokenNumber = Number.parseInt(String(input.token), 10);
  const normalizedToken = Number.isFinite(tokenNumber) && tokenNumber > 0 ? String(tokenNumber) : "";

  return [
    {
      text: "Token number",
      audioKey: "token_number",
      language: input.language,
      gender: input.gender,
    },
    normalizedToken
      ? {
          text: normalizedToken,
          audioKey: normalizedToken,
          language: input.language,
          gender: input.gender,
        }
      : null,
    {
      text: "Please go to doctor",
      audioKey: "please_go",
      language: input.language,
      gender: input.gender,
    },
  ].filter(Boolean) as AnnouncementQueueItem[];
}
