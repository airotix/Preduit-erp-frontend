/**
 * Token store for the app-issued JWT. Access token is held in memory + mirrored
 * to localStorage so a page refresh can rehydrate; refresh token likewise (a
 * later hardening pass moves the refresh token to an HttpOnly cookie).
 */
const ACCESS_KEY = "erp_access";
const REFRESH_KEY = "erp_refresh";

let _access: string | null = null;

export function setTokens(access: string | null, refresh?: string | null) {
  _access = access;
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    else localStorage.removeItem(ACCESS_KEY);
    if (refresh !== undefined) {
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
      else localStorage.removeItem(REFRESH_KEY);
    }
  } catch {
    /* SSR / storage disabled */
  }
}

export function getAccessToken(): string | null {
  if (_access) return _access;
  try {
    _access = localStorage.getItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
  return _access;
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function clearTokens() {
  _access = null;
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
