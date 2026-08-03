/**
 * Thin fetch helper for the real backend API, with auth.
 *
 *   NEXT_PUBLIC_API_URL     e.g. http://127.0.0.1:8000/api/v1
 *   NEXT_PUBLIC_USE_BACKEND "true" to hit the backend; anything else = mocks
 *
 * Every request carries the app JWT (Authorization: Bearer). On a 401 we try a
 * one-shot refresh and replay the request; if that fails we clear tokens and
 * bounce to /login. 403 and 429 surface as typed errors for the UI to handle.
 */
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth-token";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

let _refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  if (!_refreshing) {
    _refreshing = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (r) => {
        if (!r.ok) return false;
        const data = await r.json();
        // Refresh tokens rotate on every use — persist the new one too.
        setTokens(data.accessToken, data.refreshToken);
        return true;
      })
      .catch(() => false)
      .finally(() => { _refreshing = null; });
  }
  return _refreshing;
}

function redirectToLogin() {
  clearTokens();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function request<T>(path: string, init: RequestInit, retried = false): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  if (res.status === 401 && !retried) {
    if (await tryRefresh()) return request<T>(path, init, true);
    redirectToLogin();
    throw new ApiError(401, "Session expired");
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (typeof j?.detail === "string") detail = j.detail;
    } catch {
      /* ignore */
    }
    if (res.status === 429) detail = "Too many requests — please wait and try again.";
    throw new ApiError(res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export function apiUpload<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, { method: "POST", body: form });
}

/** Absolute URL for a backend path (e.g. file downloads). */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
