"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the commerce module's screens. */
export function useCommerceScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["commerce", tab],
    queryFn: () => fetchScreen(tab),
  });
}
