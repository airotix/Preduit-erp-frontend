import { mockFetch } from "@/lib/mock-fetch";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import type { ScreenConfig } from "@/lib/screen-types";
import { screens } from "./data";

/** Tabs served by the real backend (porders, stage board, BOM). */
const BACKEND_TABS: Record<string, string> = {
  porders: "/production/porders/screen",
  pboard: "/production/pboard/screen",
  bom: "/production/bom/screen",
};

/** Fetch a screen's config for the production module. */
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
