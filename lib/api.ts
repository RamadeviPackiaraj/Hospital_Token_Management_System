import { logger } from "@/lib/logger";
import { getStoredLanguage } from "@/lib/i18n";

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");

export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    details?: Array<{
      field?: string;
      message?: string;
    }> | null;
  } | null;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

interface ApiRequestConfig {
  auth?: boolean;
  retryOnAuthFailure?: boolean;
}

export class ApiRequestError<T = unknown> extends Error {
  status?: number;
  data?: ApiResponse<T> | T | null;
  path?: string;

  constructor(message: string, options: { status?: number; data?: ApiResponse<T> | T | null; path?: string } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.data = options.data;
    this.path = options.path;
  }
}

let csrfTokenCache: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

function extractPath(url?: string) {
  if (!url) return "";
  return url.replace(API_BASE_URL, "");
}

function isFormDataBody(body: BodyInit | null | undefined) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isSafeMethod(method: string) {
  return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function dispatchSessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

async function parseResponseBody<T>(response: Response): Promise<ApiResponse<T> | T | null> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as ApiResponse<T> | T;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? (text as T) : null;
}

async function fetchCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
    method: "GET",
    credentials: "include",
    headers: {
      "x-language": getStoredLanguage(),
    },
  });

  const parsed = (await parseResponseBody<{ csrfToken: string }>(response)) as ApiResponse<{ csrfToken: string }> | null;
  const nextToken = parsed && typeof parsed === "object" && "data" in parsed ? parsed.data?.csrfToken : null;
  csrfTokenCache = nextToken || null;
  return csrfTokenCache;
}

async function ensureCsrfToken(method: string) {
  if (isSafeMethod(method)) {
    return null;
  }

  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  return fetchCsrfToken();
}

async function refreshSessionSilently() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        await ensureCsrfToken("POST");
        const headers = new Headers();
        if (csrfTokenCache) {
          headers.set("x-csrf-token", csrfTokenCache);
        }
        headers.set("x-language", getStoredLanguage());

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers,
        });

        const parsed = await parseResponseBody(response);
        if (!response.ok) {
          csrfTokenCache = null;
          return false;
        }

        if (parsed && typeof parsed === "object" && "data" in parsed) {
          return true;
        }

        return true;
      } catch {
        csrfTokenCache = null;
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

function buildHeaders(options: RequestInit, method: string) {
  const headers = new Headers(options.headers);

  if (options.body != null && !isFormDataBody(options.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("x-language", getStoredLanguage());

  if (!isSafeMethod(method) && csrfTokenCache) {
    headers.set("x-csrf-token", csrfTokenCache);
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const authEnabled = config.auth !== false;
  const retryOnAuthFailure = config.retryOnAuthFailure !== false;

  if (!isSafeMethod(method)) {
    await ensureCsrfToken(method);
  }

  const requestHeaders = buildHeaders(options, method);

  logger.info(`API Request: ${path || "/"}`, {
    source: "api.request",
    data: {
      url: path || "/",
      method,
      payload: options.body,
    },
  });

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers: requestHeaders,
      credentials: "include",
    });
    const parsed = await parseResponseBody<T>(response);

    if (!response.ok) {
      if (response.status === 401 && authEnabled && retryOnAuthFailure && path !== "/auth/refresh") {
        const refreshed = await refreshSessionSilently();
        if (refreshed) {
          return apiRequest<T>(path, options, { ...config, retryOnAuthFailure: false });
        }

        dispatchSessionExpired();
      }

      const apiError = parsed && typeof parsed === "object" ? (parsed as ApiResponse<T>) : undefined;
      const message =
        apiError?.error?.details?.[0]?.message ||
        apiError?.errors?.[0]?.message ||
        apiError?.message ||
        `Request failed with status ${response.status}`;

      logger.error(`API Error: ${message}`, {
        source: "api.error",
        data: {
          url: extractPath(url) || "/",
          method,
          status: response.status,
          payload: options.body,
          response: parsed,
        },
      });

      throw new ApiRequestError(message, {
        status: response.status,
        data: parsed,
        path: extractPath(url) || "/",
      });
    }

    const successMessage =
      parsed && typeof parsed === "object" && "message" in parsed && typeof parsed.message === "string"
        ? parsed.message
        : `API Success: ${method} ${extractPath(url) || "/"}`;

    logger.success(successMessage, {
      source: "api.response",
      data: {
        url: extractPath(url) || "/",
        method,
        status: response.status,
        response: parsed,
      },
    });

    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return (parsed.data as T) ?? ({} as T);
    }

    return (parsed as T) ?? ({} as T);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiRequestError(
        `Unable to reach the API at ${API_BASE_URL}. Check that the backend server is running and the frontend API URL is correct. Original error: ${error.message}`
      );
    }

    throw error;
  }
}

export function clearApiSessionState() {
  csrfTokenCache = null;
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, value]) => value != null && value !== "");
  if (!entries.length) return "";
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return `?${search.toString()}`;
}
