/**
 * Token store for the app-issued JWT.
 *
 * Only the short-lived ACCESS token lives in JS. It's held in memory and
 * mirrored to either localStorage ("Keep me signed in" → survives restarts) or
 * sessionStorage (wiped when the tab/browser closes).
 *
 * The long-lived REFRESH token is NOT kept here — the backend delivers it as an
 * HttpOnly cookie the browser stores and sends automatically, so JS (and any
 * XSS) can never read it. Nothing in this module touches the refresh token.
 */
const ACCESS_KEY = "erp_access";

let _access: string | null = null;
// Which storage is active. Defaults to persistent so flows with no "remember
// me" choice (register, invite accept, setup) behave as before.
let _persist = true;

function hasWindow() {
  return typeof window !== "undefined";
}

function activeStore(persist: boolean): Storage {
  return persist ? window.localStorage : window.sessionStorage;
}

/** Detect which storage currently holds the access token, so writes go back to
 *  the same place. */
function detectPersistMode() {
  if (!hasWindow()) return;
  try {
    if (window.sessionStorage.getItem(ACCESS_KEY)) {
      _persist = false;
    } else if (window.localStorage.getItem(ACCESS_KEY)) {
      _persist = true;
    }
  } catch {
    /* ignore */
  }
}

export function setTokens(access: string | null, persist?: boolean) {
  if (persist !== undefined) _persist = persist;
  _access = access;
  if (!hasWindow()) return;
  try {
    // Clear both stores first so a mode switch (or logout) never leaves a stale
    // copy in the one we're not using.
    window.localStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(ACCESS_KEY);
    if (access) activeStore(_persist).setItem(ACCESS_KEY, access);
  } catch {
    /* SSR / storage disabled */
  }
}

export function getAccessToken(): string | null {
  if (_access) return _access;
  detectPersistMode();
  try {
    _access = window.sessionStorage.getItem(ACCESS_KEY) ?? window.localStorage.getItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
  return _access;
}

export function clearTokens() {
  _access = null;
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
}
