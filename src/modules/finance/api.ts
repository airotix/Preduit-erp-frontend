import { mockFetch } from "@/lib/mock-fetch";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { mergeDashboard, type DashboardOverrides } from "@/lib/dashboard-merge";
import type { ScreenConfig } from "@/lib/screen-types";
import { screens } from "./data";

/** List tabs served by the real backend. */
const BACKEND_TABS: Record<string, string> = {
  coa: "/finance/coa/screen",
  journals: "/finance/journals/screen",
  payments: "/finance/payments/screen",
  bills: "/finance/bills/screen",
  araging: "/finance/araging/screen",
  apaging: "/finance/apaging/screen",
};

/** Fetch a screen's config for the finance module. */
export async function fetchScreen(tab: string): Promise<ScreenConfig> {
  const mock = screens[tab];
  // Reports dashboard: merge real KPI values onto the mock layout.
  if (USE_BACKEND && tab === "finreports" && mock?.kind === "dashboard") {
    try {
      const ov = await apiGet<DashboardOverrides>("/dashboards/finreports");
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
