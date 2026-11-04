"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

/** Carrier names from the Carriers list, for type-ahead suggestions on shipment forms. */
export function useCarriers() {
  const { data } = useQuery({
    queryKey: ["shipment-carriers"],
    queryFn: () => apiGet<{ carriers: { name: string; service: string }[] }>("/shipments/carriers/search?q="),
  });
  return data?.carriers ?? [];
}

/** Put next to an <input list={id}>: offers the known carriers as suggestions. */
export function CarrierList({ id }: { id: string }) {
  const carriers = useCarriers();
  return <datalist id={id}>{carriers.map((c) => <option key={c.name} value={c.name}>{c.service}</option>)}</datalist>;
}

/** Tells the user a typed carrier is new and will be added to the Carriers list. */
export function NewCarrierHint({ value }: { value: string }) {
  const carriers = useCarriers();
  const typed = value.trim();
  if (!typed || carriers.some((c) => c.name.toLowerCase() === typed.toLowerCase())) return null;
  return <p className="text-xs text-muted-foreground">“{typed}” is new and will be added to your carriers list.</p>;
}
