"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";

type ReceiptLine = { id: string; name: string; color: string | null; size: string | null;
  sku: string | null; ordered: number; received: number; remaining: number };
type ReceiptOrder = { id: string; poNo: string; supplier: string; ready: boolean;
  status: string; plannedLocation: string | null; lines: ReceiptLine[] };
type Queue = { orders: ReceiptOrder[]; total: number; locations: { id: string; name: string }[] };
const input = "rounded-md border border-border/70 bg-background px-3 py-2 text-sm disabled:opacity-50";

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
  return <details className="rounded-lg border border-border/60">
    <summary className="cursor-pointer px-4 py-3 text-sm">
      <span className="font-semibold">{order.poNo} · {order.supplier}</span>
      <span className={`ml-3 ${order.ready ? "text-green-700" : "text-muted-foreground"}`}>{order.status}</span>
    </summary>
    <div className="space-y-3 border-t border-border/60 p-4">
      <p className="text-sm text-muted-foreground">Record only the units physically received. Remaining quantities stay open for a later receipt.</p>
      {order.plannedLocation && <p className="text-sm">Planned warehouse: <strong>{order.plannedLocation}</strong>. Select the actual receiving location below.</p>}
      <form onSubmit={submit} className="space-y-3">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="text-xs text-muted-foreground">
            <th className="pb-2">Item / colour / size</th><th className="pb-2 text-right">Ordered</th>
            <th className="pb-2 text-right">Received</th><th className="pb-2 text-right">Remaining</th>
            <th className="pb-2 text-right">Arrived now</th>
          </tr></thead>
          <tbody>{order.lines.map((line) => <tr key={line.id} className="border-t border-border/50">
            <td className="py-2">{line.name} · {line.color || "—"} · {line.size || "—"}
              <span className="block text-xs text-muted-foreground">{line.sku}</span></td>
            <td className="text-right tabular-nums">{line.ordered}</td>
            <td className="text-right tabular-nums">{line.received}</td>
            <td className="text-right tabular-nums">{line.remaining}</td>
            <td className="py-2 text-right"><input type="number" min={0} max={line.remaining} step={1}
              aria-label={`${line.name} ${line.color} ${line.size} arrived now`}
              disabled={!order.ready || !canWrite || receive.isPending || !line.remaining}
              value={quantities[line.id] ?? ""} placeholder="0"
              onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: event.target.value }))}
              className={`${input} w-24 text-right`} /></td>
          </tr>)}</tbody>
        </table></div>
        {order.ready && !locations.length && <p className="text-sm text-amber-700">Create an Inventory location before confirming receipt.</p>}
        {order.ready && <fieldset disabled={!canWrite || receive.isPending || !locations.length} className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm"><span className="block font-semibold">Received at</span>
            <select value={location} onChange={(event) => setLocation(event.target.value)} className={`${input} w-full`}>
              <option value="">Choose warehouse / store</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select></label>
          <label className="space-y-1 text-sm"><span className="block font-semibold">Receipt reference</span>
            <input value={reference} maxLength={80} onChange={(event) => setReference(event.target.value)}
              placeholder="Delivery note / receipt reference" className={`${input} w-full`} /></label>
          <label className="space-y-1 text-sm"><span className="block font-semibold">Reason</span>
            <input value={reason} maxLength={400} onChange={(event) => setReason(event.target.value)} className={`${input} w-full`} /></label>
          {canWrite && <button type="submit" className="rounded-md bg-[#23263A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {receive.isPending ? "Recording receipt…" : "Confirm physical receipt"}</button>}
        </fieldset>}
        {!order.ready && <p className="text-sm text-amber-700">Complete production and pass final QC before receiving these goods.</p>}
        {(error || receive.error) && <p role="alert" className="text-sm text-destructive">{error || receive.error?.message}</p>}
      </form>
    </div>
  </details>;
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
  return <section className="mb-4 space-y-3 rounded-xl border border-border/60 bg-background p-4">
    <div><h2 className="font-semibold">Warehouse receiving</h2>
      <p className="mt-1 text-sm text-muted-foreground">Production and QC prepare goods for receipt. Confirm their arrival here to add warehouse stock.</p></div>
    {posted && <p role="status" className="text-sm text-green-700">Recorded <Link className="underline" href={`/procurement/receipts/${posted.public_id}`}>{posted.grn_no}</Link>.</p>}
    {error ? <p role="alert" className="text-sm text-destructive">{error.message}</p> : isLoading ? <p>Loading receipts…</p> :
      data?.orders.length ? data.orders.map((order) => <ReceiveOrder key={order.id} order={order}
        locations={data.locations} canWrite={canWrite} onPosted={setPosted} />) : <p className="text-sm text-muted-foreground">No outstanding production purchase orders to receive.</p>}
    {data && (offset > 0 || offset + 25 < data.total) && <div className="flex items-center gap-3 text-sm">
      <button disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 25))}>Previous</button>
      <span>{offset + 1}–{Math.min(offset + 25, data.total)} of {data.total}</span>
      <button disabled={offset + 25 >= data.total} onClick={() => setOffset(offset + 25)}>Next</button>
    </div>}
  </section>;
}
