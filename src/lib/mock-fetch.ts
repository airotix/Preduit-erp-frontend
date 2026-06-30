/** Simulated network latency for the in-memory mock APIs. */
export function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a synchronous mock-data lookup in a Promise with a small delay,
 * so TanStack Query behaves exactly as it would against a real backend
 * (loading states, caching, refetch, optimistic updates all work).
 */
export async function mockFetch<T>(value: T, ms?: number): Promise<T> {
  await delay(ms);
  if (value === undefined || value === null) {
    throw new Error("Not found");
  }
  // Return a structured clone so consumers can't mutate the mock store.
  return JSON.parse(JSON.stringify(value)) as T;
}
