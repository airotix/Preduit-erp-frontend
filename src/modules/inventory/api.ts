import { mockFetch } from "@/lib/mock-fetch";
import type { ScreenConfig } from "@/lib/screen-types";
import { screens } from "./data";

/** Fetch a screen's config for the inventory module (simulated async). */
export function fetchScreen(tab: string): Promise<ScreenConfig> {
  return mockFetch(screens[tab]);
}

/** List the tab ids this module serves. */
export function listTabs(): string[] {
  return Object.keys(screens);
}
