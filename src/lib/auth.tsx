"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setTokens, getAccessToken, clearTokens } from "@/lib/auth-token";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export interface AuthUser {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  permissions: string[];
  isPlatformAdmin: boolean;
  company: {
    id: string | null;
    name: string | null;
    currency?: string | null;
    setupComplete?: boolean;
    /** Module ids chosen in the setup wizard. null/undefined = not set yet
     *  (pre-existing tenants) — treat as "every module enabled". */
    enabledModules?: string[] | null;
  };
}

export interface CompanySetupPayload {
  companyName: string;
  country?: string;
  city?: string;
  currency: string;
  taxRegistration?: string;
  modules: string[];
  invites: { email: string; role: string }[];
}

/** Where to send a freshly-authenticated user: setup wizard until it's done. */
export function postAuthPath(user: AuthUser | null): string {
  if (user && user.company && user.company.setupComplete === false) return "/setup";
  return "/dashboard/overview";
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean, businessName?: string) => Promise<AuthUser>;
  register: (p: RegisterPayload) => Promise<AuthUser>;
  verifyEmail: (email: string, code: string) => Promise<AuthUser>;
  resendVerification: (email: string) => Promise<{ devCode?: string }>;
  acceptInvite: (token: string, name: string, password: string) => Promise<AuthUser>;
  completeSetup: (p: CompanySetupPayload) => Promise<AuthUser>;
  listBusinesses: () => Promise<Business[]>;
  switchBusiness: (businessId: string) => Promise<AuthUser>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

export interface Business { businessId: string; name: string; role: string }

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
    credentials: "include",   // carry the HttpOnly refresh cookie
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
        // Access token stale/absent — try a refresh. The HttpOnly cookie (if
        // any) proves identity; nothing to read from JS.
        try {
          const r = await authFetch<{ accessToken: string; user: AuthUser }>(
            "/auth/refresh", { method: "POST" });
          setTokens(r.accessToken);
          if (!cancelled) setUser(r.user);
        } catch {
          clearTokens();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = React.useCallback(async (email: string, password: string, remember = true, businessName?: string): Promise<AuthUser> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, businessName, remember }),
      credentials: "include", cache: "no-store",
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
    const r = (await res.json()) as { accessToken: string; user: AuthUser };
    // "Keep me signed in" unchecked → session-only storage for the access token
    // (the refresh cookie's lifetime is set server-side from the same flag).
    setTokens(r.accessToken, remember);
    setUser(r.user);
    return r.user;
  }, []);

  const listBusinesses = React.useCallback(async () => {
    const r = await authFetch<{ businesses: Business[] }>("/auth/businesses", {}, getAccessToken());
    return r.businesses;
  }, []);

  const switchBusiness = React.useCallback(async (businessId: string) => {
    const r = await authFetch<{ accessToken: string; user: AuthUser }>(
      "/auth/switch-business", { method: "POST", body: JSON.stringify({ businessId }) }, getAccessToken());
    setTokens(r.accessToken);
    setUser(r.user);
    return r.user;
  }, []);

  const register = React.useCallback(async (p: RegisterPayload) => {
    const r = await authFetch<{ accessToken: string; user: AuthUser }>(
      "/auth/register-company", { method: "POST", body: JSON.stringify(p) });
    setTokens(r.accessToken);
    setUser(r.user);
    return r.user;
  }, []);

  const verifyEmail = React.useCallback(async (email: string, code: string) => {
    const r = await authFetch<{ accessToken: string; user: AuthUser }>(
      "/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }) });
    setTokens(r.accessToken);
    setUser(r.user);
    return r.user;
  }, []);

  const resendVerification = React.useCallback(async (email: string) => {
    return await authFetch<{ devCode?: string }>(
      "/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
  }, []);

  const acceptInvite = React.useCallback(async (token: string, name: string, password: string) => {
    const r = await authFetch<{ accessToken: string; user: AuthUser }>(
      "/auth/invitations/accept", { method: "POST", body: JSON.stringify({ token, name, password }) });
    setTokens(r.accessToken);
    setUser(r.user);
    return r.user;
  }, []);

  const completeSetup = React.useCallback(async (p: CompanySetupPayload) => {
    const r = await authFetch<{ user: AuthUser; invited: unknown[] }>(
      "/auth/company/setup", { method: "POST", body: JSON.stringify(p) }, getAccessToken());
    setUser(r.user);
    return r.user;
  }, []);

  const logout = React.useCallback(() => {
    // Best-effort server-side revocation (reads + clears the HttpOnly cookie);
    // don't block the UI on it.
    void fetch(`${API_BASE}/auth/logout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", keepalive: true,
    }).catch(() => { /* ignore */ });
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  const hasPermission = React.useCallback(
    (perm: string) => {
      const perms = user?.permissions ?? [];
      return perms.includes("*") || perms.includes(perm);
    },
    [user]
  );

  const value = React.useMemo(
    () => ({ user, loading, login, register, verifyEmail, resendVerification, acceptInvite,
             completeSetup, listBusinesses, switchBusiness, logout, hasPermission }),
    [user, loading, login, register, verifyEmail, resendVerification, acceptInvite,
     completeSetup, listBusinesses, switchBusiness, logout, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
