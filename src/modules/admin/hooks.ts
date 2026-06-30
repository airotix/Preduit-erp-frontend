"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScreenConfig } from "@/lib/screen-types";
import { fetchScreen } from "./api";

/** Typed TanStack Query hook for the admin module's screens. */
export function useAdminScreen(tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["admin", tab],
    queryFn: () => fetchScreen(tab),
  });
}
