"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  return <>
    <PageHeader crumb="Shipments" title="Prepare shipment" />
    <div className="erp-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:px-[26px]">
    <Link className="text-sm text-primary hover:underline" href="/shipments/shipments?view=ready">Back to shipments</Link>
    <p className="mt-2 text-sm text-muted-foreground">Confirm the quantities travelling together, then enter the transport details. Nothing is dispatched yet.</p>
    {!selected.length && <p className="mt-4 text-sm">Select goods from Ready to ship first.</p>}
    {!!selected.length && <form onSubmit={submit} className="mt-4 space-y-4">
      <Card className="overflow-hidden"><Table>
        <TableHeader><TableRow><TableHead>Article</TableHead><TableHead>Eligible</TableHead><TableHead>Ship now</TableHead><TableHead>Remaining</TableHead></TableRow></TableHeader>
        <TableBody>{selected.map((row) => {
          const now = Number(qty[row.key] ?? row.eligible) || 0;
          return <TableRow key={row.key}><TableCell>{row.article} · {row.color || "—"} / {row.size || "—"}
            <span className="block text-xs text-muted-foreground">{row.party} · {row.source}{row.batch ? ` · ${row.batch}` : ""}</span></TableCell>
            <TableCell className="tabular-nums">{row.eligible}</TableCell>
            <TableCell><Input aria-label={`Ship now ${row.article}`} type="number" min={0} max={row.eligible} className="w-24"
              disabled={!row.partial} value={qty[row.key] ?? row.eligible} onChange={(e) => setQty({ ...qty, [row.key]: e.target.value })} /></TableCell>
            <TableCell className="tabular-nums">{Math.max(0, row.eligible - now)}</TableCell></TableRow>;
        })}</TableBody>
      </Table></Card>
      {needsWarehouse && <div className="max-w-sm space-y-1.5"><Label htmlFor="prep-warehouse">Destination warehouse</Label>
        <NativeSelect id="prep-warehouse" required value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Choose warehouse</option>
          {data?.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
        </NativeSelect></div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="prep-origin">Origin</Label><Input id="prep-origin" required value={origin} onChange={(e) => setOrigin(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="prep-destination">Destination</Label><Input id="prep-destination" required value={destination} onChange={(e) => setDestination(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="prep-carrier">Carrier or transport method</Label><Input id="prep-carrier" required value={carrier} onChange={(e) => setCarrier(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="prep-dispatch">Planned dispatch date</Label><Input id="prep-dispatch" value={dispatchOn} onChange={(e) => setDispatchOn(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="prep-eta">ETA</Label><Input id="prep-eta" value={eta} onChange={(e) => setEta(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="prep-tracking">Tracking reference</Label><Input id="prep-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="prep-note">Preparation note</Label><Input id="prep-note" required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      {error && <Notice tone="red">{error}</Notice>}
      <Button disabled={busy} type="submit">{busy ? "Saving…" : "Create prepared shipment"}</Button>
    </form>}
    </div>
  </>;
}
