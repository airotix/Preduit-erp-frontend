import type { QueryClient } from "@tanstack/react-query";

const listeners = new Set<() => void>();

/** Publish only after a write has succeeded, including writes outside useMutation. */
export function notifyDataChanged() {
  for (const listener of listeners) listener();
}

export function refreshData(client: QueryClient, cancelRefetch = true) {
  // Refresh visible queries; the rest reload when their screen is opened.
  return client.invalidateQueries({ refetchType: "active" }, { cancelRefetch });
}

/** Combine writes from one action and let its local success handlers finish first. */
export function subscribeToDataChanges(client: QueryClient) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listener = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void refreshData(client);
    }, 0);
  };
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (timer !== undefined) clearTimeout(timer);
  };
}

export const freshQueryDefaults = {
  staleTime: 0,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: "always" as const,
  refetchOnReconnect: "always" as const,
  retry: 1,
};
