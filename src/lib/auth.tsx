"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setTokens, getAccessToken, getRefreshToken, clearTokens } from "@/lib/auth-token";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export interface AuthUser {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  permissions: string[];
  isPlatformAdmin: boolean;
  company: { id: string | null; name: string | null };
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ devCode?: string }>;
  acceptInvite: (token: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

export interface RegisterPayload {
  companyName: string;
  ownerName: string;
  email: string;
  password: string;
  currency?: string;
}

const AuthContext = React.createContext<AuthState | null>(null);

async function authFetch<T>(path: string, opts: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = typeof j.detail === "string" ? j.detail : detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Rehydrate on load: use the stored access token; if it's stale, refresh once.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const access = getAccessToken();
      try {
        // Works with a token (real auth) and also with none when the backend
        // dev bypass is on (it returns a synthesized user).
        const me = await authFetch<AuthUser>("/auth/me", {}, access);
        if (!cancelled) setUser(me);
      } catch {
        const refresh = getRefreshToken();
        if (refresh) {
          try {
            const r = await authFetch<{ accessToken: string; refreshToken?: string; user: AuthUser }>(
              "/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: refresh }) });
            setTokens(r.accessToken, r.refreshToken);   // rotated refresh token
            if (!cancelled) setUser(r.user);
          } catch {
            clearTokens();
          }
        } else {
          clearTokens();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), cache: "no-store",
    });
    if (res.status === 423) {
      // Account locked — carry the unlock time so the UI can redirect to /locked.
      const j = await res.json().catch(() => ({}));
      const until = j?.detail?.lockedUntilMs ?? null;
      const err = new Error("Account temporarily locked.") as Error & { locked?: boolean; until?: number | null };
      err.locked = true; err.until = until;
      throw err;
    }
    if (!res.ok) {
      let detail = res.statusText;
      try { const j = await res.json(); if (typeof j?.detail === "string") detail = j.detail; } catch { /* ignore */ }
      throw new Error(detail);
    }
    const r = (await res.json()) as { accessToken: string; refreshToken: string; user: AuthUser };
    setTokens(r.accessToken, r.refreshToken);
    setUser(r.user);
  }, []);

  const register = React.useCallback(async (p: RegisterPayload) => {
    const r = await authFetch<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      "/auth/register-company", { method: "POST", body: JSON.stringify(p) });
    setTokens(r.accessToken, r.refreshToken);
    setUser(r.user);
  }, []);

  const verifyEmail = React.useCallback(async (email: string, code: string) => {
    const r = await authFetch<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      "/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }) });
    setTokens(r.accessToken, r.refreshToken);
    setUser(r.user);
  }, []);

  const resendVerification = React.useCallback(async (email: string) => {
    return await authFetch<{ devCode?: string }>(
      "/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
  }, []);

  const acceptInvite = React.useCallback(async (token: string, name: string, password: string) => {
    const r = await authFetch<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      "/auth/invitations/accept", { method: "POST", body: JSON.stringify({ token, name, password }) });
    setTokens(r.accessToken, r.refreshToken);
    setUser(r.user);
  }, []);

  const logout = React.useCallback(() => {
    const refresh = getRefreshToken();
    // Best-effort server-side revocation; don't block the UI on it.
    if (refresh) {
      void fetch(`${API_BASE}/auth/logout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }), keepalive: true,
      }).catch(() => { /* ignore */ });
    }
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  const hasPermission = React.useCallback(
    (perm: string) => !!user && (user.permissions.includes("*") || user.permissions.includes(perm)),
    [user]
  );

  const value = React.useMemo(
    () => ({ user, loading, login, register, verifyEmail, resendVerification, acceptInvite, logout, hasPermission }),
    [user, loading, login, register, verifyEmail, resendVerification, acceptInvite, logout, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
