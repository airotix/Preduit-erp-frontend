/**
 * Fetch helper for the AI Insights module.
 *
 * The browser talks to the ERP backend's `/ai` facade — NOT the forecasting
 * engine directly. The ERP backend converses with the engine, stores the
 * responses in its own tenant-scoped tables, and serves the AI screens from
 * there (see backend `app/modules/ai`). This keeps CORS, auth and the engine
 * token on the server side.
 *
 *   NEXT_PUBLIC_AI_API_URL   override the AI facade base (defaults to the ERP
 *                            backend API base + "/ai")
 *   NEXT_PUBLIC_USE_AI_BACKEND  "false" to disable the calls (default: on)
 */
const ERP_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

const AI_BASE = process.env.NEXT_PUBLIC_AI_API_URL ?? `${ERP_BASE}/ai`;

export const USE_AI_BACKEND =
  process.env.NEXT_PUBLIC_USE_AI_BACKEND !== "false";

let _token: string | null = null;

/** Optionally attach an ERP access token to AI facade calls (prod auth). */
export function setAiToken(token: string | null) {
  _token = token;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) h.Authorization = `Bearer ${_token}`;
  return h;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const url = new URL(`${AI_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

export async function aiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`AI API ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function aiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`AI API ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function aiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "PUT",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`AI API ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Absolute URL for an engine path (file downloads / export). */
export function aiUrl(path: string): string {
  return `${AI_BASE}${path}`;
}

export { AI_BASE };
