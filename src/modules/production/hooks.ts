"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the production module's screens. */
export function useProductionScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["production", tab],
    queryFn: () => fetchScreen(tab),
  });
}
