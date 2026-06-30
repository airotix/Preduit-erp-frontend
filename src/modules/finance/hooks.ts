"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the finance module's screens. */
export function useFinanceScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["finance", tab],
    queryFn: () => fetchScreen(tab),
  });
}
