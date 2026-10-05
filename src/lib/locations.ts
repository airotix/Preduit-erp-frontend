import countryList from "./countries.json";

export type LocationOption = { code: string; name: string; stateCode?: string; stateName?: string };
export const COUNTRIES: LocationOption[] = countryList;
const fold = (s: string) => s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function countryCode(value?: string | null): string | undefined {
  const key = fold(value || "");
  const aliases: Record<string, string> = { uk: "GB", usa: "US", uae: "AE", "united states of america": "US" };
  return aliases[key] || COUNTRIES.find(c => c.code.toLowerCase() === key || fold(c.name) === key)?.code;
}
export function searchCountries(query: string): LocationOption[] {
  const key = fold(query);
  const resolved = countryCode(query);
  return COUNTRIES.filter(c => c.code === resolved || fold(c.name).includes(key) || c.code.toLowerCase().startsWith(key)).slice(0, 50);
}

// Bounded session cache and shared in-flight requests prevent repeated lookups.
const cache = new Map<string, LocationOption[]>();
const pending = new Map<string, Promise<LocationOption[]>>();
export function locationOptions(kind: "state" | "city", country: string, state = "", query = "") {
  const params = new URLSearchParams({ country });
  if (kind === "city") { if (state) params.set("state", state); params.set("q", query.trim()); }
  const path = `/locations/${kind === "state" ? "states" : "cities"}?${params}`;
  if (cache.has(path)) return Promise.resolve(cache.get(path)!);
  if (pending.has(path)) return pending.get(path)!;
  const request = fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"}${path}`, { cache: "force-cache" })
    .then(async response => {
      if (!response.ok) throw new Error("Location search is unavailable. Please retry.");
      const options = await response.json() as LocationOption[];
      if (cache.size >= 200) cache.delete(cache.keys().next().value!);
      cache.set(path, options);
      return options;
    }).finally(() => pending.delete(path));
  pending.set(path, request);
  return request;
}
