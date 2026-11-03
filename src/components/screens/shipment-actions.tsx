"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { statusTone, tone } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { LoadingBlock, Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/tone-badge";

type Line = { lineId: number; orderLineId: number | null; name: string; sku: string | null; qty: number;
  delivered: number | null; discrepancy: number; discrepancyStatus: string | null };
type Action = { id: string; label: string; blocked: boolean; reason: string | null };
type State = { id: string; ref: string; direction: string; label: string; legacy: boolean; batchManaged: boolean;
  transport: { origin: string; destination: string; carrier: string; dispatchOn: string; eta: string; tracking: string };
  receivingHref: string | null; lines: Line[];
  inbound: { allocationId: number; qty: number; accepted: number; discrepancy: number; discrepancyStatus: string }[];
  actions: Action[] };

const FIELD_LABELS = { origin: "Origin", destination: "Destination", carrier: "Carrier", dispatchOn: "Dispatch on", eta: "ETA", tracking: "Tracking" } as const;
// The steps that move the shipment forward are primary buttons; the rest are secondary.
const PRIMARY_ACTIONS = new Set(["pack", "dispatch", "deliver", "resolve"]);

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
  if (error) return <Notice tone="red" className="my-5">{error.message}</Notice>;
  if (!data || !transport) return <Card className="my-5 p-5"><LoadingBlock rows={3} /></Card>;
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
  const button = (action: Action) => <Button key={action.id} type="button" size="sm" variant={PRIMARY_ACTIONS.has(action.id) ? "default" : "outline"}
    disabled={busy || !access.canWrite || action.blocked} onClick={() => {
      if (action.id === "pack") return run("pack", { lines: data.lines.map((line) => ({ lineId: line.orderLineId || line.lineId, quantity: Number(quantities[line.lineId] ?? line.qty) })) });
      if (action.id === "deliver") return run("deliver", { lines: data.lines.map((line) => ({ lineId: line.lineId, quantity: Number(quantities[line.lineId] ?? line.qty) })) });
      if (action.id === "resolve") return run("resolve", { lines: data.lines.filter((line) => line.discrepancyStatus === "Open").map((line) => ({ lineId: line.lineId, quantity: line.discrepancy })), allocationId: data.inbound[0]?.allocationId });
      return run(action.id);
    }}>{action.label}</Button>;
  return <Card className="my-5 space-y-4 p-5">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{data.ref} · {data.direction}</h3><ToneBadge tone={statusTone(data.label)}>{data.label}</ToneBadge>
    </div>
    {data.legacy && <Notice tone="amber">This historical delivery has no recorded arrival quantities. It is flagged for reconciliation and its quantities were not guessed.</Notice>}
    <Table>
      <TableHeader><TableRow><TableHead className="px-0">Article</TableHead><TableHead>On shipment</TableHead><TableHead>This action</TableHead><TableHead>Delivered</TableHead><TableHead>Unresolved</TableHead></TableRow></TableHeader>
      <TableBody>{data.lines.map((line) => <TableRow key={line.lineId}><TableCell className="px-0">{line.name}</TableCell>
        <TableCell className="tabular-nums">{line.qty}</TableCell>
        <TableCell><Input aria-label={`Quantity for ${line.name}`} type="number" min={0} max={line.qty} className="w-24"
          value={quantities[line.lineId] ?? line.qty} onChange={(e) => setQuantities({ ...quantities, [line.lineId]: e.target.value })} /></TableCell>
        <TableCell className="tabular-nums">{line.delivered ?? "—"}</TableCell>
        <TableCell>{line.discrepancy ? <span style={{ color: tone("amber").fg }}>{line.discrepancy} {line.discrepancyStatus || ""}</span> : "—"}</TableCell></TableRow>)}</TableBody>
    </Table>
    <div className="grid gap-3 sm:grid-cols-3">
      {(Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]).map((field) => <div key={field} className="space-y-1.5"><Label htmlFor={`ship-${field}`}>{FIELD_LABELS[field]}</Label>
        <Input id={`ship-${field}`} value={transport[field]} onChange={(e) => setTransport({ ...transport, [field]: e.target.value })} /></div>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5"><Label htmlFor="ship-tracking-event">Tracking event</Label>
        <NativeSelect id="ship-tracking-event" value={trackingStatus} onChange={(e) => setTrackingStatus(e.target.value)}>
          <option value="">No status change</option><option>In transit</option><option>Customs</option><option>Out for delivery</option>
        </NativeSelect></div>
      <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ship-reason">Reason</Label>
        <Input id="ship-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
    </div>
    <div className="flex flex-wrap gap-2">{data.actions.filter((action) => action.id !== "receive").map(button)}
      {data.receivingHref && <Button asChild size="sm" variant="outline"><Link href={data.receivingHref}>Open warehouse receiving</Link></Button>}
      {data.batchManaged && data.direction === "Outgoing" && ["Dispatched", "In transit", "Delivered"].includes(data.label) && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={async () => {
        setMessage(""); setBusy(true);
        try { await apiPost(`/batches/shipments/${shipmentId}/status`, { status: "Returned", reason: reason.trim() || "Returned pieces held for QC", requestId: crypto.randomUUID() }); await client.invalidateQueries(); }
        catch (err) { setMessage(err instanceof Error ? err.message : "The return could not be recorded"); }
        finally { setBusy(false); }
      }}>Record return for QC</Button>}
    </div>
    {data.actions.filter((action) => action.blocked && action.reason).map((action) => <p key={action.id} className="text-xs text-muted-foreground">{action.label}: {action.reason}</p>)}
    {message && <Notice tone="red">{message}</Notice>}
    {!access.canWrite && <p className="text-sm text-muted-foreground">Shipment write access is required for these actions.</p>}
  </Card>;
}
