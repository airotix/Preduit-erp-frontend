"use client";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingBlock, Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Packing = { shipment: string; order: string; status: string; packedAt: string | null; packedBy: string | null;
  dispatched: boolean; allowPartialShipments: boolean;
  lines: { lineId: number; name: string; color: string | null; size: string | null; reserved: number; outstanding: number; quantity: number }[] };

export function ShipmentPacking({ shipmentId, onSaved }: { shipmentId: string; onSaved?: () => void }) {
  const access = useModuleAccess("shipments"), client = useQueryClient();
  const q = useQuery({ queryKey: ["shipment-packing", shipmentId], queryFn: () => apiGet<Packing>(`/shipments/shipments/${shipmentId}/packing`) });
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});
  const [reason, setReason] = React.useState("Physical packing confirmation");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  const request = React.useRef<{ key: string; id: string } | null>(null);
  const s = q.data;
  const confirm = async (e: React.FormEvent) => {
    e.preventDefault(); if (!s) return;
    const body = { reason, lines: s.lines.map(l => ({ orderLineId: l.lineId, quantity: Number(quantities[l.lineId] ?? l.quantity) })) };
    const key = JSON.stringify(body);
    if (!request.current || request.current.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true); setError("");
    try { await apiPost(`/shipments/shipments/${shipmentId}/pack`, { ...body, requestId: request.current.id });
      request.current = null; await client.invalidateQueries(); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not confirm packing"); }
    finally { setBusy(false); }
  };
  return <Card className="my-5 space-y-4 p-5"><h3 className="font-bold">Packing confirmation</h3>
    {(error || q.error) && <Notice tone="red">{error || String(q.error)}</Notice>}
    {q.isLoading && <LoadingBlock rows={2} />}
    {s && (s.packedAt ? <p className="text-sm">Packed by {s.packedBy} · {new Date(s.packedAt).toLocaleString()}. Quantities are fixed for this shipment.</p> : s.status === "Cancelled" ? <p className="text-sm">This shipment is cancelled.</p> :
      <form onSubmit={confirm} className="space-y-4"><p className="text-sm text-muted-foreground">{s.allowPartialShipments ? "Enter the units physically packed. Remaining units stay on the order for later shipments." : "This order must ship complete. Pack all outstanding units before dispatch."}</p>
        <Table><TableHeader><TableRow><TableHead className="px-0">Item</TableHead><TableHead className="text-center">Reserved</TableHead><TableHead className="text-center">Outstanding</TableHead><TableHead className="text-center">Actual packed</TableHead></TableRow></TableHeader>
          <TableBody>{s.lines.map(l => <TableRow key={l.lineId}><TableCell className="px-0">{l.name} · {l.color} / {l.size}</TableCell><TableCell className="text-center tabular-nums">{l.reserved}</TableCell><TableCell className="text-center tabular-nums">{l.outstanding}</TableCell>
            <TableCell className="text-center"><Input aria-label={`Packed quantity for ${l.name} ${l.color} ${l.size}`} type="number" min="0" max={Math.min(l.reserved, l.outstanding)} step="1" required
              className="mx-auto w-28" disabled={busy || !access.canWrite} value={quantities[l.lineId] ?? l.quantity}
              onChange={e => setQuantities({ ...quantities, [l.lineId]: e.target.value })} /></TableCell></TableRow>)}</TableBody></Table>
        <div className="space-y-1.5"><Label htmlFor="pack-note">Packing reference / note</Label><Input id="pack-note" required minLength={3} maxLength={400}
          value={reason} onChange={e => setReason(e.target.value)} /></div>
        <Button disabled={busy || !access.canWrite}>{busy ? "Saving…" : "Confirm packed quantities"}</Button></form>)}
  </Card>;
}
