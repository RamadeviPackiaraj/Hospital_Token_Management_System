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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  config: { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const hasBody = options.body != null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (config.auth !== false) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to connect to the backend service.";
    throw new Error(
      `Unable to reach the API at ${API_BASE_URL}. Check that the backend server is running and the frontend API URL is correct. Original error: ${message}`
    );
  }

  const raw = await response.text();
  let parsed: ApiResponse<T> | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as ApiResponse<T>;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message =
      parsed?.errors?.[0]?.message ||
      parsed?.message ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  if (parsed && typeof parsed === "object" && "data" in parsed) {
    return (parsed.data as T) ?? ({} as T);
  }

  return (parsed as T) ?? ({} as T);
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, value]) => value != null && value !== "");
  if (!entries.length) return "";
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return `?${search.toString()}`;
}
