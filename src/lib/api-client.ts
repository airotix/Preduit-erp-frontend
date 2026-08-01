/**
 * Thin fetch helper for the real backend API.
 *
 * Base URL and the on/off switch come from env (see .env.local):
 *   NEXT_PUBLIC_API_URL     e.g. http://127.0.0.1:8000/api/v1
 *   NEXT_PUBLIC_USE_BACKEND "true" to hit the backend; anything else = mocks
 *
 * While DEV_AUTH_BYPASS is enabled on the backend, no auth header is needed.
 * When real auth lands, attach the Entra access token here.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Absolute URL for a backend path (e.g. file downloads). */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

/** Multipart upload (FormData). */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}
