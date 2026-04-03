import { logger } from "@/lib/logger";

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");

const AUTH_TOKEN_KEY = "hospital_token_auth_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

interface ApiRequestConfig {
  auth?: boolean;
}

function extractPath(url?: string) {
  if (!url) return "";
  return url.replace(API_BASE_URL, "");
}

function isFormDataBody(body: BodyInit | null | undefined) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function buildHeaders(options: RequestInit, config: ApiRequestConfig) {
  const headers = new Headers(options.headers);
  const authEnabled = config.auth !== false;

  if (options.body != null && !isFormDataBody(options.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authEnabled) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const requestHeaders = buildHeaders(options, config);

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
    });
    const parsed = await parseResponseBody<T>(response);

    if (!response.ok) {
      const apiError = parsed && typeof parsed === "object" ? (parsed as ApiResponse<T>) : undefined;
      const message =
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

      throw new Error(message);
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
      throw new Error(
        `Unable to reach the API at ${API_BASE_URL}. Check that the backend server is running and the frontend API URL is correct. Original error: ${error.message}`
      );
    }

    throw error;
  }
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, value]) => value != null && value !== "");
  if (!entries.length) return "";
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return `?${search.toString()}`;
}
