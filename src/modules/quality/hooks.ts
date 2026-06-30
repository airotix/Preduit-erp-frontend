"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the quality module's screens. */
export function useQualityScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["quality", tab],
    queryFn: () => fetchScreen(tab),
  });
}
