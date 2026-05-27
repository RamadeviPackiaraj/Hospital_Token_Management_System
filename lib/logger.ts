"use client";

import toast from "react-hot-toast";
import { useLogStore, type LogEntry, type LogLevel } from "@/store/logStore";

interface LogOptions {
  data?: unknown;
  toast?: boolean;
  source?: string;
  destructive?: boolean;
}

const toastBaseStyle = {
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  fontWeight: 500,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
} as const;

const REMOTE_LOG_QUEUE_KEY = "hospital_token_remote_log_queue";
const REMOTE_LOG_API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/+$/, "") + "/logs";
const MAX_REMOTE_MESSAGE_LENGTH = 1000;
const MAX_REMOTE_SOURCE_LENGTH = 120;
const MAX_REMOTE_DATA_BYTES = 9000;
const REMOTE_LOG_QUEUE_LIMIT = 50;
const REMOTE_LOG_SILENT_SOURCES = new Set(["api.request", "api.response"]);
const REMOTE_LOG_DEDUP_WINDOW_MS = 2000;
const recentRemoteLogKeys = new Map<string, number>();

interface RemoteLogPayload {
  type: LogLevel;
  message: string;
  source?: string;
  origin: "frontend";
  data?: unknown;
}

class RemoteLogError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RemoteLogError";
    this.status = status;
  }
}

function showToast(type: LogLevel, message: string, destructive = false) {
  if (type === "success" && !destructive) {
    toast.success(message, {
      iconTheme: {
        primary: "#16A34A",
        secondary: "#FFFFFF",
      },
      style: {
        ...toastBaseStyle,
        border: "1px solid #BBF7D0",
        background: "#F0FDF4",
        color: "#166534",
      },
    });
    return;
  }

  if (type === "error" || destructive) {
    toast.error(message, {
      iconTheme: {
        primary: "#DC2626",
        secondary: "#FFFFFF",
      },
      style: {
        ...toastBaseStyle,
        border: "1px solid #FECACA",
        background: "#FEF2F2",
        color: "#991B1B",
      },
    });
    return;
  }

  if (type === "warn") {
    toast(message, {
      icon: "!",
      style: {
        ...toastBaseStyle,
        border: "1px solid #FDE68A",
        background: "#FFFBEB",
        color: "#92400E",
      },
    });
    return;
  }

  toast(message, {
    style: {
      ...toastBaseStyle,
      border: "1px solid #BAE6FD",
      background: "#F0FDFF",
      color: "#0F4C5C",
    },
  });
}

function sanitizeLogData(data: unknown) {
  if (data === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(
      JSON.stringify(data, (_key, value) => {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }

        return value;
      })
    );
  } catch {
    return String(data);
  }
}

function byteLength(value: unknown) {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function truncateText(value: string | undefined, maxLength: number) {
  if (!value) return value;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function buildRemotePayload(type: LogLevel, message: string, options: LogOptions = {}): RemoteLogPayload {
  const sanitizedData = sanitizeLogData(options.data);
  const safeData =
    sanitizedData !== undefined && byteLength(sanitizedData) > MAX_REMOTE_DATA_BYTES
      ? { truncated: true, reason: "remote log data exceeded safe size" }
      : sanitizedData;

  return {
    type,
    message: truncateText(message, MAX_REMOTE_MESSAGE_LENGTH) || "Log message",
    source: truncateText(options.source, MAX_REMOTE_SOURCE_LENGTH),
    origin: "frontend",
    data: safeData,
  };
}

function getRemoteLogQueue(): RemoteLogPayload[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(REMOTE_LOG_QUEUE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setRemoteLogQueue(queue: RemoteLogPayload[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (queue.length === 0) {
      window.localStorage.removeItem(REMOTE_LOG_QUEUE_KEY);
      return;
    }

    window.localStorage.setItem(REMOTE_LOG_QUEUE_KEY, JSON.stringify(queue.slice(-REMOTE_LOG_QUEUE_LIMIT)));
  } catch {
    // Ignore queue persistence failures.
  }
}

async function postRemoteLog(payload: RemoteLogPayload) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(REMOTE_LOG_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: "include",
  });

  if (!response.ok) {
    throw new RemoteLogError(`Remote log request failed with status ${response.status}`, response.status);
  }
}

let flushPromise: Promise<void> | null = null;

async function flushRemoteLogQueue() {
  const queuedLogs = getRemoteLogQueue();
  if (queuedLogs.length === 0) {
    return;
  }

  const pendingLogs = [...queuedLogs];
  setRemoteLogQueue([]);

  for (let index = 0; index < pendingLogs.length; index += 1) {
    const payload = pendingLogs[index];

    try {
      await postRemoteLog(payload);
    } catch (error) {
      if (error instanceof RemoteLogError && error.status === 422) {
        continue;
      }

      setRemoteLogQueue(pendingLogs.slice(index));
      return;
    }
  }
}

function flushRemoteLogQueueOnce() {
  if (!flushPromise) {
    flushPromise = flushRemoteLogQueue().finally(() => {
      flushPromise = null;
    });
  }

  return flushPromise;
}

export function flushQueuedRemoteLogs() {
  if (typeof window === "undefined") {
    return;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGER === "false") {
    return;
  }

  void flushRemoteLogQueueOnce();
}

function persistLog(type: LogLevel, message: string, options: LogOptions = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGER === "false") {
    return;
  }

  if (options.source && REMOTE_LOG_SILENT_SOURCES.has(options.source)) {
    return;
  }

  const payload = buildRemotePayload(type, message, options);
  const dedupeKey = `${payload.type}:${payload.source || ""}:${payload.message}`;
  const lastSentAt = recentRemoteLogKeys.get(dedupeKey) || 0;
  if (Date.now() - lastSentAt < REMOTE_LOG_DEDUP_WINDOW_MS) {
    return;
  }
  recentRemoteLogKeys.set(dedupeKey, Date.now());
  if (recentRemoteLogKeys.size > 100) {
    const cutoff = Date.now() - REMOTE_LOG_DEDUP_WINDOW_MS;
    for (const [key, timestamp] of recentRemoteLogKeys.entries()) {
      if (timestamp < cutoff) {
        recentRemoteLogKeys.delete(key);
      }
    }
  }

  void flushRemoteLogQueueOnce()
    .catch(() => {
      // Ignore queue flush errors and continue with the current log attempt.
    })
    .finally(() => {
      void postRemoteLog(payload).catch((error) => {
        if (error instanceof RemoteLogError && error.status === 422) {
          return;
        }

        setRemoteLogQueue([...getRemoteLogQueue(), payload].slice(-REMOTE_LOG_QUEUE_LIMIT));
      });
    });
}

function add(type: LogLevel, message: string, options: LogOptions = {}) {
  persistLog(type, message, options);

  const logsEnabled =
    process.env.NEXT_PUBLIC_ENABLE_LOGGER !== "false" &&
    process.env.NODE_ENV !== "production";

  if (!logsEnabled) {
    if (options.toast && typeof window !== "undefined") {
      showToast(type, message, options.destructive);
    }
    return;
  }

  useLogStore.getState().addLog({
    type,
    message,
    source: options.source,
    data: options.data,
  });

  if (!options.toast || typeof window === "undefined") {
    return;
  }

  showToast(type, message, options.destructive);
}

export const logger = {
  info(message: string, options?: LogOptions) {
    add("info", message, options);
  },
  success(message: string, options?: LogOptions) {
    add("success", message, options);
  },
  warn(message: string, options?: LogOptions) {
    add("warn", message, options);
  },
  error(message: string, options?: LogOptions) {
    add("error", message, options);
  },
};

export type { LogEntry };
