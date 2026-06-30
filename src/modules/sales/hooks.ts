"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the sales module's screens. */
export function useSalesScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["sales", tab],
    queryFn: () => fetchScreen(tab),
  });
}
