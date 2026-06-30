"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the procurement module's screens. */
export function useProcurementScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["procurement", tab],
    queryFn: () => fetchScreen(tab),
  });
}
