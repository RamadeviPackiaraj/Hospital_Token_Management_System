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

const AUTH_TOKEN_KEY = "hospital_token_auth_token";
const REMOTE_LOG_QUEUE_KEY = "hospital_token_remote_log_queue";
const REMOTE_LOG_API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/+$/, "") + "/logs";

interface RemoteLogPayload {
  type: LogLevel;
  message: string;
  source?: string;
  origin: "frontend";
  data?: unknown;
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
      border: "1px solid #E2E8F0",
      background: "#FFFFFF",
      color: "#0F172A",
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

    window.localStorage.setItem(REMOTE_LOG_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
  } catch {
    // Ignore queue persistence failures.
  }
}

async function postRemoteLog(payload: RemoteLogPayload) {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(REMOTE_LOG_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(`Remote log request failed with status ${response.status}`);
  }
}

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
    } catch {
      setRemoteLogQueue(pendingLogs.slice(index));
      return;
    }
  }
}

export function flushQueuedRemoteLogs() {
  if (typeof window === "undefined") {
    return;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGER === "false") {
    return;
  }

  void flushRemoteLogQueue();
}

function persistLog(type: LogLevel, message: string, options: LogOptions = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGER === "false") {
    return;
  }

  const payload: RemoteLogPayload = {
    type,
    message,
    source: options.source,
    origin: "frontend",
    data: sanitizeLogData(options.data),
  };

  void flushRemoteLogQueue()
    .catch(() => {
      // Ignore queue flush errors and continue with the current log attempt.
    })
    .finally(() => {
      void postRemoteLog(payload).catch(() => {
        setRemoteLogQueue([...getRemoteLogQueue(), payload]);
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
