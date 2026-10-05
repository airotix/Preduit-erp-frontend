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
  canCreatePO: boolean;
  lines: { lineId: number; name: string; color: string | null; size: string | null; ordered: number; reserved: number; missing: number }[];
  purchaseOrders: { publicId: string; poNo: string }[];
  shipment: { publicId: string; shipmentNo: string } | null;
};

export function CreateShortagePOButton({ orderId, onSaved }: { orderId: string; onSaved?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [supplierId, setSupplierId] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const queryClient = useQueryClient();
  const sales = useModuleAccess("sales");
  const procurement = useModuleAccess("procurement");
  const { data: suppliers = [], isLoading, error: suppliersError } = useQuery({
    queryKey: ["sales", "shortage-suppliers"],
    queryFn: () => apiGet<{ publicId: string; name: string }[]>("/sales/shortage-suppliers"),
    enabled: open,
  });
  const create = async () => {
    setPending(true); setError("");
    try {
      await apiPost(`/sales/orders/${orderId}/create-po`, { supplierId });
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
          <Dialog.Title className="text-lg font-bold">Create PO for missing stock</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">Select a supplier. The PO uses only missing quantities and saved supplier prices. Expected delivery uses the supplier’s lead time, or 30 days if unset.</Dialog.Description>
        <label htmlFor={`shortage-supplier-${orderId}`} className="text-sm font-medium">Supplier</label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger id={`shortage-supplier-${orderId}`}><SelectValue placeholder={isLoading ? "Loading suppliers…" : "Select supplier"} /></SelectTrigger>
          <SelectContent>{suppliers.map((supplier) => <SelectItem key={supplier.publicId} value={supplier.publicId}>{supplier.name}</SelectItem>)}</SelectContent>
        </Select>
        {!isLoading && !suppliers.length && !suppliersError && <p className="text-sm text-muted-foreground">Add a supplier in Procurement first.</p>}
        {(error || suppliersError) && <p role="alert" className="text-sm text-destructive">{error || String(suppliersError)}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!supplierId || pending || !!suppliersError} onClick={create}>{pending ? "Creating…" : "Create PO"}</Button>
        </div>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}

export function OrderFulfillmentPanel({ data, orderId, onSaved }: { data: OrderFulfillment; orderId: string; onSaved?: () => void }) {
  return <div className="rounded-xl border bg-white p-6">
    <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Inventory allocation</h3>
      {data.canCreatePO && <CreateShortagePOButton orderId={orderId} onSaved={onSaved} />}
    </div>
    <p className="mb-4 text-sm text-muted-foreground">Available quantities stay on hold for this order. The full order ships after final QC and inventory receipt of the missing items.</p>
    <div className="overflow-x-auto"><ResponsiveTable className="w-full text-left text-sm"><thead><tr>
      <th>Item</th><th>Color / size</th><th className="text-right">Ordered</th><th className="text-right">Reserved</th><th className="text-right">Missing</th>
    </tr></thead><tbody>{data.lines.map((line) => <tr key={line.lineId} className="border-t">
      <td className="py-2">{line.name}</td><td>{[line.color, line.size].filter(Boolean).join(" / ") || "—"}</td>
      <td className="text-right">{line.ordered}</td><td className="text-right">{line.reserved}</td><td className="text-right">{line.missing}</td>
    </tr>)}</tbody></ResponsiveTable></div>
    <div className="mt-4 flex flex-wrap gap-4">
      {data.purchaseOrders.map((po) => <Link className="text-sm font-semibold text-primary" key={po.publicId} href={`/procurement/pos/${po.publicId}`}>Open {po.poNo}</Link>)}
      {data.shipment && <Link className="text-sm font-semibold text-primary" href={`/shipments/shipments/${data.shipment.publicId}`}>Open {data.shipment.shipmentNo}</Link>}
    </div>
  </div>;
}
