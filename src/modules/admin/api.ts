import { mockFetch } from "@/lib/mock-fetch";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import type { ScreenConfig } from "@/lib/screen-types";
import { screens } from "./data";

const BACKEND_TABS: Record<string, string> = {
  users: "/admin/users/screen",
  roles: "/admin/roles/screen",
  approvalrules: "/admin/approvalrules/screen",
  doclibrary: "/admin/doclibrary/screen",
  audit: "/admin/audit/screen",
};

/** Fetch a screen's config for the admin module. */
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
