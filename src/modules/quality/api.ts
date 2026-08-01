import { mockFetch } from "@/lib/mock-fetch";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { mergeDashboard, type DashboardOverrides } from "@/lib/dashboard-merge";
import type { ScreenConfig } from "@/lib/screen-types";
import { screens } from "./data";

const BACKEND_TABS: Record<string, string> = {
  inspections: "/quality/inspections/screen",
  defects: "/quality/defects/screen",
};

/** Fetch a screen's config for the quality module. */
export async function fetchScreen(tab: string): Promise<ScreenConfig> {
  const mock = screens[tab];
  if (USE_BACKEND && tab === "qscores" && mock?.kind === "dashboard") {
    try {
      const ov = await apiGet<DashboardOverrides>("/dashboards/qscores");
      return mergeDashboard(mock, ov);
    } catch {
      /* fall back to mock */
    }
  }
  if (USE_BACKEND && BACKEND_TABS[tab]) {
    return apiGet<ScreenConfig>(BACKEND_TABS[tab]);
  }
  return mockFetch(screens[tab]);
}

/** List the tab ids this module serves. */
export function listTabs(): string[] {
  return Object.keys(screens);
}
