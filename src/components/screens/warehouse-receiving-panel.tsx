"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { statusTone } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { LoadingBlock, Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/tone-badge";

type ReceiptLine = { id: string; name: string; color: string | null; size: string | null;
  sku: string | null; ordered: number; received: number; remaining: number };
type ReceiptOrder = { id: string; poNo: string; supplier: string; ready: boolean;
  shipment?: { id: string; ref: string; status: string } | null;
  status: string; plannedLocation: string | null; lines: ReceiptLine[] };
type BatchShipment = { id: string; ref: string; supplier: string; destination: string | null; status: string;
  lines: { allocationId: number; name: string; color: string | null; size: string | null; batch: string; shipped: number }[] };
type Queue = { orders: ReceiptOrder[]; total: number; locations: { id: string; name: string }[]; batchShipments?: BatchShipment[] };

function ReceiveOrder({ order, locations, canWrite, onPosted }: {
  order: ReceiptOrder; locations: Queue["locations"]; canWrite: boolean;
  onPosted: (receipt: { public_id: string; grn_no: string }) => void;
}) {
  const client = useQueryClient();
  const [quantities, setQuantities] = React.useState<Record<string, string>>({});
  const [location, setLocation] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [reason, setReason] = React.useState("Physical warehouse receipt");
  const [error, setError] = React.useState<string | null>(null);
  const request = React.useRef<{ key: string; id: string } | null>(null);
  const receive = useMutation({
    mutationFn: (body: { locationId: string; lines: { poLineId: string; quantity: number }[];
      reference: string; reason: string; requestId: string }) =>
      apiPost<{ public_id: string; grn_no: string }>(`/inventory/receiving/${order.id}`, body),
    onSuccess: (result) => {
      onPosted(result); setQuantities({}); setReference(""); request.current = null;
      void client.invalidateQueries();
    },
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (!location) return setError("Choose the location that physically received the goods.");
    if (reference.trim().length < 3 || reason.trim().length < 3)
      return setError("Enter a receipt reference and reason of at least three characters.");
    const lines = [];
    for (const line of order.lines) {
      const quantity = Number(quantities[line.id] || 0);
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > line.remaining)
        return setError(`Enter between 0 and ${line.remaining} units for ${line.name} / ${line.color} / ${line.size}.`);
      if (quantity) lines.push({ poLineId: line.id, quantity });
    }
    if (!lines.length) return setError("Enter the quantities that actually arrived.");
    const body = { locationId: location, lines, reference: reference.trim(), reason: reason.trim() };
    const key = JSON.stringify(body);
    if (!request.current || request.current.key !== key) request.current = { key, id: crypto.randomUUID() };
    receive.mutate({ ...body, requestId: request.current.id });
  };
  return <details className="rounded-[14px] border border-border/70 bg-card shadow-erp-sm">
    <summary className="cursor-pointer px-4 py-3 text-sm">
      <span className="font-semibold">{order.poNo} · {order.supplier}</span>
      <ToneBadge className="ml-3" tone={order.ready ? "green" : "neutral"}>{order.status}</ToneBadge>
    </summary>
    <div className="space-y-3 border-t border-border/60 p-4">
      <p className="text-sm text-muted-foreground">Record only the units physically received. Remaining quantities stay open for a later receipt.</p>
      {order.shipment && <p className="text-sm">Supplier shipment: <Link className="font-bold text-primary hover:underline" href={`/shipments/shipments/${order.shipment.id}`}>{order.shipment.ref}</Link> · <ToneBadge tone={statusTone(order.shipment.status)}>{order.shipment.status}</ToneBadge></p>}
      {order.plannedLocation && <p className="text-sm">Planned warehouse: <strong>{order.plannedLocation}</strong>. Select the actual receiving location below.</p>}
      <form onSubmit={submit} className="space-y-3">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="px-0">Item / colour / size</TableHead><TableHead className="text-right">Ordered</TableHead>
            <TableHead className="text-right">Received</TableHead><TableHead className="text-right">Remaining</TableHead>
            <TableHead className="text-right">Arrived now</TableHead>
          </TableRow></TableHeader>
          <TableBody>{order.lines.map((line) => <TableRow key={line.id}>
            <TableCell className="px-0">{line.name} · {line.color || "—"} · {line.size || "—"}
              <span className="block text-xs text-muted-foreground">{line.sku}</span></TableCell>
            <TableCell className="text-right tabular-nums">{line.ordered}</TableCell>
            <TableCell className="text-right tabular-nums">{line.received}</TableCell>
            <TableCell className="text-right tabular-nums">{line.remaining}</TableCell>
            <TableCell className="text-right"><Input type="number" min={0} max={line.remaining} step={1}
              aria-label={`${line.name} ${line.color} ${line.size} arrived now`}
              disabled={!order.ready || !canWrite || receive.isPending || !line.remaining}
              value={quantities[line.id] ?? ""} placeholder="0"
              onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: event.target.value }))}
              className="ml-auto w-24 text-right" /></TableCell>
          </TableRow>)}</TableBody>
        </Table>
        {order.ready && !locations.length && <Notice tone="amber">Create an Inventory location before confirming receipt.</Notice>}
        {order.ready && <fieldset disabled={!canWrite || receive.isPending || !locations.length} className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor={`recv-loc-${order.id}`}>Received at</Label>
            <NativeSelect id={`recv-loc-${order.id}`} value={location} onChange={(event) => setLocation(event.target.value)}>
              <option value="">Choose warehouse / store</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </NativeSelect></div>
          <div className="space-y-1.5"><Label htmlFor={`recv-ref-${order.id}`}>Receipt reference</Label>
            <Input id={`recv-ref-${order.id}`} value={reference} maxLength={80} onChange={(event) => setReference(event.target.value)}
              placeholder="Delivery note / receipt reference" /></div>
          <div className="space-y-1.5"><Label htmlFor={`recv-reason-${order.id}`}>Reason</Label>
            <Input id={`recv-reason-${order.id}`} value={reason} maxLength={400} onChange={(event) => setReason(event.target.value)} /></div>
          {canWrite && <Button type="submit" className="sm:col-span-3 sm:justify-self-start">
            {receive.isPending ? "Recording receipt…" : "Confirm physical receipt"}</Button>}
        </fieldset>}
        {!order.ready && <Notice tone="amber">{order.status}</Notice>}
        {(error || receive.error) && <Notice tone="red">{error || receive.error?.message}</Notice>}
      </form>
    </div>
  </details>;
}

function BatchReceive({ ship, locations, canWrite, onPosted }: {
  ship: BatchShipment; locations: Queue["locations"]; canWrite: boolean;
  onPosted: (receipt: { public_id: string; grn_no: string }) => void;
}) {
  const client = useQueryClient();
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});
  const [location, setLocation] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [reason, setReason] = React.useState("Physical warehouse receipt");
  const [error, setError] = React.useState<string | null>(null);
  const request = React.useRef<{ key: string; id: string } | null>(null);
  const receive = useMutation({
    mutationFn: (body: { locationId: string; lines: { allocationId: number; quantity: number }[];
      reference: string; reason: string; requestId: string }) =>
      apiPost<{ public_id: string; grn_no: string }>(`/inventory/receiving/shipments/${ship.id}`, body),
    onSuccess: (result) => { onPosted(result); request.current = null; void client.invalidateQueries(); },
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (!location) return setError("Choose the location that physically received the goods.");
    if (reference.trim().length < 3 || reason.trim().length < 3)
      return setError("Enter a receipt reference and reason of at least three characters.");
    const lines = ship.lines.map((line) => ({ allocationId: line.allocationId, quantity: Number(quantities[line.allocationId] ?? line.shipped) }));
    if (lines.some((line) => !Number.isInteger(line.quantity) || line.quantity < 0))
      return setError("Enter a whole number for every line.");
    const body = { locationId: location, lines, reference: reference.trim(), reason: reason.trim() };
    const key = JSON.stringify(body);
    if (!request.current || request.current.key !== key) request.current = { key, id: crypto.randomUUID() };
    receive.mutate({ ...body, requestId: request.current.id });
  };
  return <form onSubmit={submit} className="space-y-3 rounded-[14px] border border-border/70 bg-card p-4 shadow-erp-sm">
    <p className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">{ship.ref} · {ship.supplier}</span><ToneBadge tone={statusTone(ship.status)}>{ship.status}</ToneBadge></p>
    <Table>
      <TableHeader><TableRow><TableHead className="px-0">Article</TableHead><TableHead>Batch</TableHead><TableHead className="text-right">Dispatched</TableHead><TableHead className="text-right">Arrived now</TableHead></TableRow></TableHeader>
      <TableBody>{ship.lines.map((line) => <TableRow key={line.allocationId}>
        <TableCell className="px-0">{line.name} · {line.color || "—"} · {line.size || "—"}</TableCell>
        <TableCell>{line.batch}</TableCell><TableCell className="text-right tabular-nums">{line.shipped}</TableCell>
        <TableCell className="text-right"><Input type="number" min={0} max={line.shipped} className="ml-auto w-24 text-right"
          aria-label={`${line.name} arrived now`} value={quantities[line.allocationId] ?? line.shipped}
          onChange={(event) => setQuantities((current) => ({ ...current, [line.allocationId]: event.target.value }))} /></TableCell>
      </TableRow>)}</TableBody></Table>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5"><Label htmlFor={`batch-loc-${ship.id}`}>Received at</Label><NativeSelect id={`batch-loc-${ship.id}`} value={location} onChange={(e) => setLocation(e.target.value)}>
        <option value="">Choose warehouse / store</option>{locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}</NativeSelect></div>
      <div className="space-y-1.5"><Label htmlFor={`batch-ref-${ship.id}`}>Receipt reference</Label><Input id={`batch-ref-${ship.id}`} value={reference} onChange={(e) => setReference(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor={`batch-reason-${ship.id}`}>Reason</Label><Input id={`batch-reason-${ship.id}`} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
    </div>
    {canWrite && <Button type="submit" disabled={receive.isPending}>Confirm physical receipt</Button>}
    {(error || receive.error) && <Notice tone="red">{error || receive.error?.message}</Notice>}
  </form>;
}

export function WarehouseReceivingPanel() {
  const { canRead, canWrite } = useModuleAccess("inventory");
  const [offset, setOffset] = React.useState(0);
  const [posted, setPosted] = React.useState<{ public_id: string; grn_no: string } | null>(null);
  const { data, error, isLoading } = useQuery<Queue>({
    queryKey: ["inventory", "receiving", offset],
    queryFn: () => apiGet<Queue>(`/inventory/receiving?limit=25&offset=${offset}`), enabled: canRead,
  });
  React.useEffect(() => {
    if (data && offset > 0 && offset >= data.total) setOffset(Math.max(0, (Math.ceil(data.total / 25) - 1) * 25));
  }, [data, offset]);
  return <Card className="mb-4 space-y-3 p-4">
    <div><h2 className="font-semibold">Warehouse receiving</h2>
      <p className="mt-1 text-sm text-muted-foreground">Production and QC prepare goods for receipt. Confirm their arrival here to add warehouse stock.</p></div>
    {posted && <Notice tone="green" role="status">Recorded <Link className="underline" href={`/procurement/receipts/${posted.public_id}`}>{posted.grn_no}</Link>.</Notice>}
    {error ? <Notice tone="red">{error.message}</Notice> : isLoading ? <LoadingBlock rows={2} /> :
      data?.orders.length ? data.orders.map((order) => <ReceiveOrder key={order.id} order={order}
        locations={data.locations} canWrite={canWrite} onPosted={setPosted} />) : <p className="text-sm text-muted-foreground">No outstanding production purchase orders to receive.</p>}
    {!!data?.batchShipments?.length && <div className="space-y-3 border-t border-border/60 pt-3">
      <h3 className="font-semibold">Dispatched batch shipments</h3>
      <p className="text-sm text-muted-foreground">These goods have left the supplier. Enter the quantities that actually arrived. Missing units stay unresolved and are not added to stock.</p>
      {data.batchShipments.map((ship) => <BatchReceive key={ship.id} ship={ship} locations={data.locations} canWrite={canWrite} onPosted={setPosted} />)}
    </div>}
    {data && (offset > 0 || offset + 25 < data.total) && <div className="flex items-center gap-3 text-sm">
      <Button variant="outline" size="sm" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 25))}>Previous</Button>
      <span>{offset + 1}–{Math.min(offset + 25, data.total)} of {data.total}</span>
      <Button variant="outline" size="sm" disabled={offset + 25 >= data.total} onClick={() => setOffset(offset + 25)}>Next</Button>
    </div>}
  </Card>;
}
