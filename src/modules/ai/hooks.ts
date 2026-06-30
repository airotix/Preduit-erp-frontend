"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the ai module's screens. */
export function useAiScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["ai", tab],
    queryFn: () => fetchScreen(tab),
  });
}
