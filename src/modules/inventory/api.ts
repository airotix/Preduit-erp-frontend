import { mockFetch } from "@/lib/mock-fetch";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import type { ScreenConfig } from "@/lib/screen-types";
import { screens } from "./data";

/** Tabs served by the real backend (others still use the in-memory mock). */
const BACKEND_TABS: Record<string, string> = {
  stock: "/inventory/stock/screen",
  locations: "/inventory/locations/screen",
  transfers: "/inventory/transfers/screen",
  alerts: "/inventory/alerts/screen",
};

/** Fetch a screen's config for the inventory module. */
export function fetchScreen(tab: string): Promise<ScreenConfig> {
  if (USE_BACKEND && BACKEND_TABS[tab]) {
    return apiGet<ScreenConfig>(BACKEND_TABS[tab]);
  }
  return mockFetch(screens[tab]);
}

/** List the tab ids this module serves. */
export function listTabs(): string[] {
  return Object.keys(screens);
}
