import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
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

type InternalAxiosConfig = AxiosRequestConfig & {
  metadata?: {
    auth?: boolean;
  };
};

type InterceptorConfig = InternalAxiosRequestConfig & {
  metadata?: {
    auth?: boolean;
  };
};

function extractPath(url?: string) {
  if (!url) return "";
  return url.replace(API_BASE_URL, "");
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
  });

  client.interceptors.request.use(
    (config: InterceptorConfig) => {
      const authEnabled = config.metadata?.auth !== false;
      const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
      const headers = AxiosHeaders.from(config.headers);

      if (!isFormData && config.data != null && !headers.get("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      if (authEnabled) {
        const token = getAuthToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      config.headers = headers;

      logger.info(`API Request: ${extractPath(config.url) || "/"}`, {
        source: "api.request",
        data: {
          url: extractPath(config.url) || "/",
          method: (config.method || "GET").toUpperCase(),
          payload: config.data,
          params: config.params,
        },
      });

      return config;
    },
    (error) => {
      logger.error("API Request Error", {
        source: "api.request",
        data: { message: error instanceof Error ? error.message : String(error) },
      });
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      const path = extractPath(response.config.url) || "/";
      const message =
        response.data?.message || `API Success: ${response.config.method?.toUpperCase() || "GET"} ${path}`;

      logger.success(message, {
        source: "api.response",
        data: {
          url: path,
          method: response.config.method?.toUpperCase(),
          status: response.status,
          response: response.data,
        },
      });

      return response;
    },
    (error: AxiosError<ApiResponse<unknown>>) => {
      const path = extractPath(error.config?.url) || "/";
      const message =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        error.message ||
        "Request failed";

      logger.error(`API Error: ${message}`, {
        source: "api.error",
        data: {
          url: path,
          method: error.config?.method?.toUpperCase(),
          status: error.response?.status,
          payload: (error.config as InternalAxiosConfig | undefined)?.data,
          response: error.response?.data,
        },
      });

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {}
): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T> | T>({
      url: path,
      method: options.method || "GET",
      data: options.body,
      headers: options.headers as Record<string, string> | undefined,
      metadata: {
        auth: config.auth,
      },
    } as InternalAxiosConfig);

    const parsed = response.data;

    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return (parsed.data as T) ?? ({} as T);
    }

    return (parsed as T) ?? ({} as T);
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<T>>(error)) {
      if (!error.response) {
        throw new Error(
          `Unable to reach the API at ${API_BASE_URL}. Check that the backend server is running and the frontend API URL is correct. Original error: ${error.message}`
        );
      }

      const message =
        error.response.data?.errors?.[0]?.message ||
        error.response.data?.message ||
        error.message ||
        "Request failed";

      throw new Error(message);
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
