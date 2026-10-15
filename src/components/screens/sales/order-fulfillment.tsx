"use client";
import { Table as ResponsiveTable } from "@/components/ui/table";


import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";

export type OrderFulfillment = {
  allowPartialShipments?: boolean;
  batchManaged?: boolean;
  shipments?: { publicId: string; shipmentNo: string; status: string; packed: boolean; dispatched: boolean }[];
  canCreatePO: boolean;
  lines: { lineId: number; productId?: number | null; name: string; color: string | null; size: string | null; ordered: number; reserved: number; dispatched?: number; outstanding?: number; missing: number; toPurchase?: number }[];
  purchaseOrders: { publicId: string; poNo: string }[];
  shipment: { publicId: string; shipmentNo: string } | null;
};

export function CreateShortagePOButton({ orderId, onSaved }: { orderId: string; onSaved?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [supplierIds, setSupplierIds] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const queryClient = useQueryClient();
  const sales = useModuleAccess("sales");
  const procurement = useModuleAccess("procurement");
  const { data: detail, isLoading: loadingItems, error: itemsError } = useQuery<{ fulfillment: OrderFulfillment | null }>({
    queryKey: ["sales", "shortage-items", orderId],
    queryFn: () => apiGet(`/sales/orders/${orderId}/detail`),
    enabled: open, staleTime: 0,
  });
  const items = React.useMemo(() => {
    const groups: Record<string, OrderFulfillment["lines"]> = {};
    for (const line of detail?.fulfillment?.lines ?? []) {
      if ((line.toPurchase ?? line.missing) > 0) (groups[String(line.productId ?? line.name)] ??= []).push(line);
    }
    return Object.entries(groups);
  }, [detail]);
  const { data: suppliers = [], isLoading, error: suppliersError } = useQuery({
    queryKey: ["sales", "shortage-suppliers"],
    queryFn: () => apiGet<{ publicId: string; name: string }[]>("/sales/shortage-suppliers"),
    enabled: open,
  });
  const create = async () => {
    setPending(true); setError("");
    try {
      await apiPost(`/sales/orders/${orderId}/create-po`, {
        assignments: items.flatMap(([name, lines]) => lines.map((line) => ({ lineId: line.lineId, supplierId: supplierIds[name] }))),
      });
      for (const key of [["screen", "sales"], ["screen", "inventory"], ["screen", "procurement"],
        ["screen", "production"], ["screen", "shipments"], ["sales"], ["inventory"], ["production"], ["finance"], ["procurement", "invoices"]]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      setOpen(false); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create PO"); }
    finally { setPending(false); }
  };
  return <>
    <Button size="sm" variant="outline" disabled={!sales.canWrite || !procurement.canWrite}
      title={!sales.canWrite ? sales.reason ?? undefined : !procurement.canWrite ? procurement.reason ?? undefined : undefined}
      onClick={(e) => { e.stopPropagation(); setError(""); setOpen(true); }}>Create PO</Button>
    <Dialog.Root open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
      <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" onClick={(e) => e.stopPropagation()} />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <Dialog.Title className="text-lg font-bold">Create POs for missing stock</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">Choose a supplier for each item. Each item gets a separate PO containing its missing colors and sizes at saved supplier prices.</Dialog.Description>
        <div className="max-h-[45vh] space-y-4 overflow-y-auto">
          {loadingItems && <p className="text-sm">Loading missing items…</p>}
          {items.map(([name, lines], index) => <div key={name} className="space-y-2">
            <label htmlFor={`shortage-supplier-${orderId}-${index}`} className="text-sm font-medium">{lines[0].name} · {lines.reduce((sum, line) => sum + (line.toPurchase ?? line.missing), 0)} units</label>
            <p className="text-xs text-muted-foreground">{lines.map((line) => `${[line.color, line.size].filter(Boolean).join(" / ")}: ${line.toPurchase ?? line.missing}`).join(" · ")}</p>
            <Select disabled={pending} value={supplierIds[name] ?? ""} onValueChange={(value) => setSupplierIds((current) => ({ ...current, [name]: value }))}>
              <SelectTrigger id={`shortage-supplier-${orderId}-${index}`}><SelectValue placeholder={isLoading ? "Loading suppliers…" : "Select supplier"} /></SelectTrigger>
              <SelectContent>{suppliers.map((supplier) => <SelectItem key={supplier.publicId} value={supplier.publicId}>{supplier.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>)}
          {!loadingItems && detail && !items.length && <p className="text-sm">All shortages are already covered by stock or active POs.</p>}
        </div>
        {!isLoading && !suppliers.length && !suppliersError && <p className="text-sm text-muted-foreground">Add a supplier in Procurement first.</p>}
        {(error || suppliersError || itemsError) && <p role="alert" className="text-sm text-destructive">{error || String(suppliersError || itemsError)}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={pending || isLoading || loadingItems || !!suppliersError || !!itemsError || !items.length || items.some(([name]) => !supplierIds[name])} onClick={create}>{pending ? "Creating…" : `Create ${items.length} PO${items.length === 1 ? "" : "s"}`}</Button>
        </div>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}

export function OrderFulfillmentPanel({ data, orderId, onSaved }: { data: OrderFulfillment; orderId: string; onSaved?: () => void }) {
  const access = useModuleAccess("sales"), client = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const pending = React.useRef<{ value: boolean; id: string } | null>(null);
  const changePolicy = async (value: boolean) => {
    if (!pending.current || pending.current.value !== value) pending.current = { value, id: crypto.randomUUID() };
    setBusy(true); setError("");
    try { await apiPost(`/sales/orders/${orderId}/shipment-policy`, { allowPartialShipments: value, requestId: pending.current.id });
      pending.current = null; await client.invalidateQueries(); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not change shipment policy"); }
    finally { setBusy(false); }
  };
  return <div className="rounded-xl border bg-white p-6">
    <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Inventory allocation</h3>
      {data.canCreatePO && <CreateShortagePOButton orderId={orderId} onSaved={onSaved} />}
    </div>
    <p className="mb-4 text-sm text-muted-foreground">Available quantities stay on hold for this order. Confirm physical packing in Shipments before dispatch. Outstanding quantities remain on this order until shipped.</p>
    {!data.batchManaged && <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.allowPartialShipments}
      disabled={!access.canWrite || busy || data.shipments?.some(s => s.packed || s.dispatched)} onChange={e => void changePolicy(e.target.checked)} />Allow partial shipments (set before packing)</label>}
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    <div className="overflow-x-auto"><ResponsiveTable className="w-full text-left text-sm"><thead><tr>
      <th>Item</th><th>Color / size</th><th className="text-right">Ordered</th><th className="text-right">Reserved</th><th className="text-right">Dispatched</th><th className="text-right">Outstanding</th><th className="text-right">Missing stock</th>
    </tr></thead><tbody>{data.lines.map((line) => <tr key={line.lineId} className="border-t">
      <td className="py-2">{line.name}</td><td>{[line.color, line.size].filter(Boolean).join(" / ") || "—"}</td>
      <td className="text-right">{line.ordered}</td><td className="text-right">{line.reserved}</td><td className="text-right">{line.dispatched ?? 0}</td><td className="text-right">{line.outstanding ?? line.ordered}</td><td className="text-right">{line.missing}</td>
    </tr>)}</tbody></ResponsiveTable></div>
    <div className="mt-4 flex flex-wrap gap-4">
      {data.purchaseOrders.map((po) => <Link className="text-sm font-semibold text-primary" key={po.publicId} href={`/procurement/pos/${po.publicId}`}>Open {po.poNo}</Link>)}
      {(data.shipments ?? (data.shipment ? [data.shipment] : [])).map(s => <Link key={s.publicId} className="text-sm font-semibold text-primary" href={`/shipments/shipments/${s.publicId}`}>Open {s.shipmentNo}{"status" in s ? ` · ${s.status}` : ""}</Link>)}
    </div>
  </div>;
}
