"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the catalog module's screens. */
export function useCatalogScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["catalog", tab],
    queryFn: () => fetchScreen(tab),
  });
}
