"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

type Source = { key: string; direction: "Incoming" | "Outgoing"; party: string; source: string; article: string;
  color: string | null; size: string | null; batch: string | null; eligible: number; partial: boolean;
  savedDestination: string | null };
type Workspace = { sources: Source[]; locations: { id: number; name: string }[] };

export default function PrepareShipmentPage() {
  const router = useRouter();
  const [keys, setKeys] = React.useState<string[]>([]);
  const [qty, setQty] = React.useState<Record<string, string>>({});
  const [origin, setOrigin] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [carrier, setCarrier] = React.useState("");
  const [dispatchOn, setDispatchOn] = React.useState("");
  const [eta, setEta] = React.useState("");
  const [tracking, setTracking] = React.useState("");
  const [reason, setReason] = React.useState("Shipment preparation");
  const [locationId, setLocationId] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const request = React.useRef<{ key: string; id: string } | null>(null);
  React.useEffect(() => {
    const stored = sessionStorage.getItem("shipment-prepare-keys");
    setKeys(stored ? JSON.parse(stored) as string[] : []);
  }, []);
  const { data } = useQuery({
    queryKey: ["shipments-prepare"],
    queryFn: () => apiGet<Workspace>("/shipments/workspace?view=ready"),
  });
  const selected = (data?.sources || []).filter((row) => keys.includes(row.key));
  const incoming = selected.some((row) => row.direction === "Incoming");
  const needsWarehouse = selected.some((row) => row.key.startsWith("bin:"));
  React.useEffect(() => {
    if (selected[0]?.savedDestination && !destination) setDestination(selected[0].savedDestination);
  }, [selected, destination]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const lines = selected.map((row) => ({ key: row.key, quantity: Number(qty[row.key] ?? row.eligible) }));
    const body = { direction: incoming ? "Incoming" : "Outgoing", origin, destination, carrier, dispatchOn, eta, tracking,
      reason, locationId: locationId ? Number(locationId) : null, lines };
    const fingerprint = JSON.stringify(body);
    if (!request.current || request.current.key !== fingerprint) request.current = { key: fingerprint, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const result = await apiPost<{ publicId: string }>(`/shipments/prepare`, { ...body, requestId: request.current.id });
      request.current = null;
      sessionStorage.removeItem("shipment-prepare-keys");
      router.push(`/shipments/shipments/${result.publicId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare the shipment");
    } finally { setBusy(false); }
  };
  return <div className="erp-scroll min-h-0 flex-1 overflow-y-auto px-[26px] py-6">
    <Link className="text-sm underline" href="/shipments/shipments?view=ready">Back to shipments</Link>
    <h1 className="mt-3 text-xl font-bold">Prepare shipment</h1>
    <p className="mt-1 text-sm text-muted-foreground">Confirm the quantities travelling together, then enter the transport details. Nothing is dispatched yet.</p>
    {!selected.length && <p className="mt-4 text-sm">Select goods from Ready to ship first.</p>}
    {!!selected.length && <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm">
        <thead><tr className="text-xs text-muted-foreground"><th className="p-3">Article</th><th>Eligible</th><th>Ship now</th><th>Remaining</th></tr></thead>
        <tbody>{selected.map((row) => {
          const now = Number(qty[row.key] ?? row.eligible) || 0;
          return <tr key={row.key} className="border-t"><td className="p-3">{row.article} · {row.color || "—"} / {row.size || "—"}
            <span className="block text-xs text-muted-foreground">{row.party} · {row.source}{row.batch ? ` · ${row.batch}` : ""}</span></td>
            <td className="tabular-nums">{row.eligible}</td>
            <td><input aria-label={`Ship now ${row.article}`} type="number" min={0} max={row.eligible} className="w-24 rounded-md border px-2 py-1"
              disabled={!row.partial} value={qty[row.key] ?? row.eligible} onChange={(e) => setQty({ ...qty, [row.key]: e.target.value })} /></td>
            <td className="tabular-nums">{Math.max(0, row.eligible - now)}</td></tr>;
        })}</tbody>
      </table></div>
      {needsWarehouse && <label className="block text-sm">Destination warehouse
        <select required className="mt-1 block rounded-md border px-3 py-2" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Choose warehouse</option>
          {data?.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
        </select></label>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Origin<input required className="mt-1 w-full rounded-md border px-3 py-2" value={origin} onChange={(e) => setOrigin(e.target.value)} /></label>
        <label className="text-sm">Destination<input required className="mt-1 w-full rounded-md border px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)} /></label>
        <label className="text-sm">Carrier or transport method<input required className="mt-1 w-full rounded-md border px-3 py-2" value={carrier} onChange={(e) => setCarrier(e.target.value)} /></label>
        <label className="text-sm">Planned dispatch date<input className="mt-1 w-full rounded-md border px-3 py-2" value={dispatchOn} onChange={(e) => setDispatchOn(e.target.value)} /></label>
        <label className="text-sm">ETA<input className="mt-1 w-full rounded-md border px-3 py-2" value={eta} onChange={(e) => setEta(e.target.value)} /></label>
        <label className="text-sm">Tracking reference<input className="mt-1 w-full rounded-md border px-3 py-2" value={tracking} onChange={(e) => setTracking(e.target.value)} /></label>
      </div>
      <label className="block text-sm">Preparation note<input required minLength={3} className="mt-1 w-full rounded-md border px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="rounded-md bg-[#23263A] px-4 py-2 text-sm font-semibold text-white">{busy ? "Saving…" : "Create prepared shipment"}</button>
    </form>}
  </div>;
}
