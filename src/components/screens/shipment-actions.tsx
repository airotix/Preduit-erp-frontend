"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";

type Line = { lineId: number; orderLineId: number | null; name: string; sku: string | null; qty: number;
  delivered: number | null; discrepancy: number; discrepancyStatus: string | null };
type Action = { id: string; label: string; blocked: boolean; reason: string | null };
type State = { id: string; ref: string; direction: string; label: string; legacy: boolean; batchManaged: boolean;
  transport: { origin: string; destination: string; carrier: string; dispatchOn: string; eta: string; tracking: string };
  receivingHref: string | null; lines: Line[];
  inbound: { allocationId: number; qty: number; accepted: number; discrepancy: number; discrepancyStatus: string }[];
  actions: Action[] };

export function ShipmentActions({ shipmentId }: { shipmentId: string }) {
  const access = useModuleAccess("shipments");
  const client = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["shipment-actions", shipmentId], queryFn: () => apiGet<State>(`/shipments/shipments/${shipmentId}/actions`) });
  const [transport, setTransport] = React.useState<State["transport"] | null>(null);
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});
  const [trackingStatus, setTrackingStatus] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const request = React.useRef<{ key: string; id: string } | null>(null);
  React.useEffect(() => { if (data && !transport) setTransport(data.transport); }, [data, transport]);
  if (error) return <p role="alert" className="text-sm text-destructive">{error.message}</p>;
  if (!data || !transport) return <p className="text-sm">Loading shipment actions…</p>;
  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    setMessage("");
    const body = { action, reason: reason.trim() || "Shipment action", ...transport, trackingStatus, ...extra };
    const fingerprint = JSON.stringify(body);
    if (!request.current || request.current.key !== fingerprint) request.current = { key: fingerprint, id: crypto.randomUUID() };
    setBusy(true);
    try {
      await apiPost(`/shipments/shipments/${shipmentId}/actions`, { ...body, requestId: request.current.id });
      request.current = null;
      setReason("");
      await client.invalidateQueries();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "The shipment action failed");
    } finally { setBusy(false); }
  };
  const button = (action: Action) => <button key={action.id} type="button" disabled={busy || !access.canWrite || action.blocked}
    className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50" onClick={() => {
      if (action.id === "pack") return run("pack", { lines: data.lines.map((line) => ({ lineId: line.orderLineId || line.lineId, quantity: Number(quantities[line.lineId] ?? line.qty) })) });
      if (action.id === "deliver") return run("deliver", { lines: data.lines.map((line) => ({ lineId: line.lineId, quantity: Number(quantities[line.lineId] ?? line.qty) })) });
      if (action.id === "resolve") return run("resolve", { lines: data.lines.filter((line) => line.discrepancyStatus === "Open").map((line) => ({ lineId: line.lineId, quantity: line.discrepancy })), allocationId: data.inbound[0]?.allocationId });
      return run(action.id);
    }}>{action.label}</button>;
  return <section className="my-5 space-y-4 rounded-xl border p-5">
    <div><h3 className="font-bold">{data.ref} · {data.direction} · {data.label}</h3>
      {data.legacy && <p className="mt-1 text-sm text-amber-700">This historical delivery has no recorded arrival quantities. It is flagged for reconciliation and its quantities were not guessed.</p>}
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs text-muted-foreground">
      <th className="pb-2">Article</th><th>On shipment</th><th>This action</th><th>Delivered</th><th>Unresolved</th></tr></thead>
      <tbody>{data.lines.map((line) => <tr key={line.lineId} className="border-t"><td className="py-2">{line.name}</td>
        <td className="tabular-nums">{line.qty}</td>
        <td><input aria-label={`Quantity for ${line.name}`} type="number" min={0} max={line.qty} className="w-24 rounded-md border px-2 py-1"
          value={quantities[line.lineId] ?? line.qty} onChange={(e) => setQuantities({ ...quantities, [line.lineId]: e.target.value })} /></td>
        <td className="tabular-nums">{line.delivered ?? "—"}</td>
        <td>{line.discrepancy ? `${line.discrepancy} ${line.discrepancyStatus || ""}` : "—"}</td></tr>)}</tbody></table></div>
    <div className="grid gap-3 sm:grid-cols-3">
      {(["origin", "destination", "carrier", "dispatchOn", "eta", "tracking"] as const).map((field) => <label key={field} className="text-sm capitalize">{field}
        <input className="mt-1 w-full rounded-md border px-3 py-2" value={transport[field]} onChange={(e) => setTransport({ ...transport, [field]: e.target.value })} /></label>)}
    </div>
    <label className="block text-sm">Tracking event
      <select className="mt-1 rounded-md border px-3 py-2" value={trackingStatus} onChange={(e) => setTrackingStatus(e.target.value)}>
        <option value="">No status change</option><option>In transit</option><option>Customs</option><option>Out for delivery</option>
      </select></label>
    <label className="block text-sm">Reason<input className="mt-1 w-full rounded-md border px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
    <div className="flex flex-wrap gap-2">{data.actions.filter((action) => action.id !== "receive").map(button)}
      {data.receivingHref && <Link className="rounded-md border px-3 py-2 text-sm font-semibold" href={data.receivingHref}>Open warehouse receiving</Link>}
      {data.batchManaged && data.direction === "Outgoing" && ["Dispatched", "In transit", "Delivered"].includes(data.label) && <button type="button" disabled={busy} className="rounded-md border px-3 py-2 text-sm font-semibold" onClick={async () => {
        setMessage(""); setBusy(true);
        try { await apiPost(`/batches/shipments/${shipmentId}/status`, { status: "Returned", reason: reason.trim() || "Returned pieces held for QC", requestId: crypto.randomUUID() }); await client.invalidateQueries(); }
        catch (err) { setMessage(err instanceof Error ? err.message : "The return could not be recorded"); }
        finally { setBusy(false); }
      }}>Record return for QC</button>}
    </div>
    {data.actions.filter((action) => action.blocked && action.reason).map((action) => <p key={action.id} className="text-xs text-muted-foreground">{action.label}: {action.reason}</p>)}
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    {!access.canWrite && <p className="text-sm text-muted-foreground">Shipment write access is required for these actions.</p>}
  </section>;
}
