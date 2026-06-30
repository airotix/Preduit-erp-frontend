"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the dashboard module's screens. */
export function useDashboardScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["dashboard", tab],
    queryFn: () => fetchScreen(tab),
  });
}
