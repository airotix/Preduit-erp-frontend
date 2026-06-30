"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchScreen } from "@/modules/registry";
import type { ScreenConfig } from "@/lib/screen-types";

/**
 * Generic screen query used by the App Router shell. Each feature module also
 * ships its own typed hook (modules/<module>/hooks.ts); this one resolves the
 * right module through the registry so a single dynamic route can serve them all.
 */
export function useScreen(module: string, tab: string) {
  return useQuery<ScreenConfig>({
    queryKey: ["screen", module, tab],
    queryFn: () => fetchScreen(module, tab),
  });
}
