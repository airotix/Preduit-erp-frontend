import { mockFetch } from "@/lib/mock-fetch";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { mergeDashboard, type DashboardOverrides } from "@/lib/dashboard-merge";
import type { ScreenConfig } from "@/lib/screen-types";
import { screens } from "./data";

/** Fetch a screen's config for the dashboard module.
 *  Dashboards merge real KPI values from the backend onto the mock layout. */
export async function fetchScreen(tab: string): Promise<ScreenConfig> {
  const mock = screens[tab];
  if (USE_BACKEND && mock?.kind === "dashboard") {
    try {
      const ov = await apiGet<DashboardOverrides>(`/dashboards/${tab}`);
      return mergeDashboard(mock, ov);
    } catch {
      /* fall back to the mock on any error */
    }
  }
  return mockFetch(screens[tab]);
}

/** List the tab ids this module serves. */
export function listTabs(): string[] {
  return Object.keys(screens);
}
