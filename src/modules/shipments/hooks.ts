"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the shipments module's screens. */
export function useShipmentsScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["shipments", tab],
    queryFn: () => fetchScreen(tab),
  });
}
