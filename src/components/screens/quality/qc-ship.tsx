"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CarrierList, NewCarrierHint } from "@/components/screens/carrier-input";

type Source = { key: string; direction: "Incoming" | "Outgoing"; party: string; source: string; article: string;
  color: string | null; size: string | null; batch: string | null; eligible: number; partial: boolean; savedDestination: string | null };
type Workspace = { sources: Source[]; locations: { id: number; name: string }[] };

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];
const sizeRank = (size: string) => { const i = SIZE_ORDER.indexOf(size.toUpperCase()); return i === -1 ? SIZE_ORDER.length : i; };

/** Choose how many released pieces of each colour and size to send, and create the shipment, without leaving Quality. */
export function QcShip({ poRef, orderRef, article }: { poRef: string | null; orderRef: string; article: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const search = poRef || orderRef;
  const { data } = useQuery({
    queryKey: ["quality", "ship-sources", search],
    queryFn: () => apiGet<Workspace>(`/shipments/workspace?view=ready&source=${encodeURIComponent(search)}`),
  });
  const [qty, setQty] = useState<Record<string, string>>({});
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [carrier, setCarrier] = useState("");
  const [locationId, setLocationId] = useState("");
  const [dispatchOn, setDispatchOn] = useState(new Date().toISOString().slice(0, 10));
  const [eta, setEta] = useState("");
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const all = data?.sources ?? [];
  const forArticle = all.filter((row) => row.article.trim().toLowerCase() === article.trim().toLowerCase());
  const rows = forArticle.length ? forArticle : all;
  if (!rows.length) return null;

  const incoming = rows[0].direction === "Incoming";
  const needsWarehouse = rows.some((row) => row.key.startsWith("bin:"));
  const colours = [...new Set(rows.map((row) => row.color || "—"))];
  const sizes = [...new Set(rows.map((row) => row.size || "—"))].sort((a, b) => sizeRank(a) - sizeRank(b));
  const find = (colour: string, size: string) => rows.find((row) => (row.color || "—") === colour && (row.size || "—") === size);
  const chosen = (row: Source) => Math.min(row.eligible, Math.max(0, Number(qty[row.key] ?? row.eligible) || 0));
  const total = rows.reduce((sum, row) => sum + chosen(row), 0);
  const originValue = origin || (incoming ? rows[0].party : "");
  const destinationValue = destination || rows[0].savedDestination || data?.locations.find((l) => String(l.id) === locationId)?.name || "";

  const create = async () => {
    setError("");
    if (!total) { setError("Enter how many pieces to send."); return; }
    if (!originValue.trim() || !destinationValue.trim() || !carrier.trim()) { setError("Fill in origin, destination and carrier."); return; }
    if (needsWarehouse && !locationId) { setError("Choose the destination warehouse."); return; }
    if (eta && dispatchOn && eta < dispatchOn) { setError("ETA cannot be earlier than the dispatch date."); return; }
    setBusy(true);
    try {
      const result = await apiPost<{ publicId: string }>("/shipments/prepare", {
        direction: incoming ? "Incoming" : "Outgoing", origin: originValue, destination: destinationValue, carrier, dispatchOn, eta, tracking,
        reason: "Prepared from Quality", locationId: locationId ? Number(locationId) : null,
        lines: rows.filter((row) => chosen(row) > 0).map((row) => ({ key: row.key, quantity: chosen(row) })),
        requestId: crypto.randomUUID(),
      });
      void client.invalidateQueries();
      router.push(`/shipments/shipments/${result.publicId}`);
    } catch (err) { setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not create the shipment."); }
    finally { setBusy(false); }
  };

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-bold">Choose what to ship</h2>
        <p className="text-sm text-muted-foreground">Released pieces for {article}. Enter how many of each colour and size to send now; the rest stays ready for later.</p>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full text-[13px]">
          <TableHeader><TableRow>
            <TableHead>Colour</TableHead>
            {sizes.map((size) => <TableHead key={size} className="text-center">{size}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {colours.map((colour) => (
              <TableRow key={colour}>
                <TableCell className="font-semibold">{colour}</TableCell>
                {sizes.map((size) => {
                  const row = find(colour, size);
                  return <TableCell key={size} className="px-1 text-center">
                    {row ? <>
                      <Input aria-label={`Ship ${colour} ${size}`} type="number" min={0} max={row.eligible} className="mx-auto w-20 text-center" disabled={!row.partial}
                        value={qty[row.key] ?? row.eligible} onChange={(e) => setQty({ ...qty, [row.key]: e.target.value })} />
                      <span className="block text-[11px] text-muted-foreground">of {row.eligible}</span>
                    </> : <span className="text-muted-foreground">—</span>}
                  </TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows.some((row) => !row.partial) && <p className="text-xs text-muted-foreground">Some items ship complete only, so their quantity cannot be changed.</p>}
      <p className="text-sm font-semibold">Sending {total} pieces {incoming ? `from ${rows[0].party}` : `to ${rows[0].party}`}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {needsWarehouse && <div className="space-y-1.5"><Label htmlFor="qs-warehouse">Destination warehouse</Label>
          <NativeSelect id="qs-warehouse" value={locationId} onChange={(e) => {
            setLocationId(e.target.value);
            const loc = data?.locations.find((l) => String(l.id) === e.target.value);
            if (loc) setDestination(loc.name);
          }}>
            <option value="">Choose warehouse</option>
            {data?.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </NativeSelect></div>}
        <div className="space-y-1.5"><Label htmlFor="qs-origin">Origin</Label><Input id="qs-origin" value={originValue} onChange={(e) => setOrigin(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="qs-destination">Destination</Label><Input id="qs-destination" value={destinationValue} onChange={(e) => setDestination(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="qs-carrier">Carrier</Label>
          <Input id="qs-carrier" list="qs-carrier-list" autoComplete="off" placeholder="Pick a carrier or type a new one" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          <CarrierList id="qs-carrier-list" /><NewCarrierHint value={carrier} /></div>
      </div>
      <details className="rounded-lg border border-border/70 px-3 py-2">
        <summary className="cursor-pointer text-sm font-semibold">Dates and tracking <span className="font-normal text-muted-foreground">(optional)</span></summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="qs-dispatch">Dispatch date</Label><Input id="qs-dispatch" type="date" value={dispatchOn} onChange={(e) => setDispatchOn(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="qs-eta">ETA</Label><Input id="qs-eta" type="date" min={dispatchOn || undefined} value={eta} onChange={(e) => setEta(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="qs-tracking">Tracking reference</Label><Input id="qs-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
        </div>
      </details>
      {error && <Notice tone="red">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy || !total} onClick={create}>{busy ? "Creating…" : "Create shipment"}</Button>
        <Link className="text-sm font-semibold text-primary hover:underline" href={`/shipments/shipments?view=ready&source=${encodeURIComponent(search)}`}>See all in Shipments</Link>
      </div>
    </Card>
  );
}
