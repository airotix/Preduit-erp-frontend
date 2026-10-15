"use client";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Button } from "@/components/ui/button";

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
  return <section className="my-5 space-y-4 rounded-xl border border-border bg-background p-5"><h3 className="font-bold">Packing confirmation</h3>
    {(error || q.error) && <p role="alert" className="text-sm text-destructive">{error || String(q.error)}</p>}
    {q.isLoading && <p className="text-sm">Loading shipment quantities…</p>}
    {s && (s.packedAt ? <p className="text-sm">Packed by {s.packedBy} · {new Date(s.packedAt).toLocaleString()}. Quantities are fixed for this shipment.</p> : s.status === "Cancelled" ? <p className="text-sm">This shipment is cancelled.</p> :
      <form onSubmit={confirm} className="space-y-4"><p className="text-sm text-muted-foreground">{s.allowPartialShipments ? "Enter the units physically packed. Remaining units stay on the order for later shipments." : "This order must ship complete. Pack all outstanding units before dispatch."}</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Item</th><th>Reserved</th><th>Outstanding</th><th>Actual packed</th></tr></thead>
          <tbody>{s.lines.map(l => <tr className="border-t border-border" key={l.lineId}><td className="py-3">{l.name} · {l.color} / {l.size}</td><td className="text-center">{l.reserved}</td><td className="text-center">{l.outstanding}</td>
            <td className="py-2 text-center"><input aria-label={`Packed quantity for ${l.name} ${l.color} ${l.size}`} type="number" min="0" max={Math.min(l.reserved, l.outstanding)} step="1" required
              className="w-28 rounded-lg border border-border bg-background px-3 py-2" disabled={busy || !access.canWrite} value={quantities[l.lineId] ?? l.quantity}
              onChange={e => setQuantities({ ...quantities, [l.lineId]: e.target.value })} /></td></tr>)}</tbody></table></div>
        <label className="block text-sm">Packing reference / note<input required minLength={3} maxLength={400} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={reason} onChange={e => setReason(e.target.value)} /></label>
        <Button disabled={busy || !access.canWrite}>{busy ? "Saving…" : "Confirm packed quantities"}</Button></form>)}
  </section>;
}
