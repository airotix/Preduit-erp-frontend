"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the inventory module's screens. */
export function useInventoryScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["inventory", tab],
    queryFn: () => fetchScreen(tab),
  });
}
