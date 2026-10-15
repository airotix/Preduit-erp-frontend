"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";

type DocumentBlocker = {
  id: string;
  ref: string;
  status: string;
  otherLines: number;
  heldUnits?: number;
  canMarkInactive?: boolean;
  blockReason?: string | null;
};
type StockRow = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  location: string;
  onHand: number;
  reserved: number;
  available: number;
};
type Preview = {
  article: string;
  onHand: number;
  reserved: number;
  stockHolds: number;
  stockRows: StockRow[];
  legacyMismatch: boolean;
  batchAllocated: number;
  batchReserved: number;
  batchMismatch: boolean;
  shipments: { id: string; ref: string; status: string; canCancel: boolean }[];
  orders: DocumentBlocker[];
  purchaseOrders: DocumentBlocker[];
  transfers: { id: string; ref: string; status: string }[];
  openStages: number;
  openInspections: number;
  canDelete: boolean;
};
type Target =
  | { kind: "order" | "po"; item: DocumentBlocker }
  | { kind: "stock"; row: StockRow }
  | { kind: "shipment"; item: { id: string; ref: string } }
  | { kind: "cache" };

export function CatalogArticleResolutionDialog({ id, onClose, onDeleted, onResolved }: {
  id: string;
  onClose: () => void;
  onDeleted: () => void;
  onResolved?: () => void;
}) {
  const queryClient = useQueryClient();
  const salesAccess = useModuleAccess("sales");
  const procurementAccess = useModuleAccess("procurement");
  const inventoryAccess = useModuleAccess("inventory");
  const shipmentAccess = useModuleAccess("shipments");
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [target, setTarget] = React.useState<Target | null>(null);
  const [reason, setReason] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [disposition, setDisposition] = React.useState("Write off");
  const [reference, setReference] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const refresh = React.useCallback(async () => {
    setPreview(await apiGet<Preview>(`/catalog/products/${id}/delete-preview`));
  }, [id]);

  React.useEffect(() => {
    let active = true;
    apiGet<Preview>(`/catalog/products/${id}/delete-preview`)
      .then((result) => { if (active) setPreview(result); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not check this article."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const choose = (next: Target) => {
    setTarget(next);
    setError("");
    setNotice("");
    setReason("");
    setConfirmed(false);
    setQuantity(next.kind === "stock" ? next.row.available : 1);
    setDisposition("Write off");
    setReference("");
  };

  const invalidate = (notify = true) => {
    for (const queryKey of [["screen", "catalog"], ["screen", "inventory"], ["screen", "sales"],
      ["screen", "procurement"], ["screen", "production"], ["screen", "quality"],
      ["catalog"], ["inventory"], ["production"]]) {
      queryClient.invalidateQueries({ queryKey });
    }
    if (notify) onResolved?.();
  };

  const resolve = async () => {
    if (!target || !reason.trim()) return;
    if ((target.kind === "order" || target.kind === "po" || target.kind === "shipment") && !confirmed) return;
    setBusy(true);
    setError("");
    try {
      if (target.kind === "shipment") {
        await apiPost(`/catalog/products/${id}/shipments/${target.item.id}/cancel`, { reason: reason.trim() });
        setNotice(`${target.item.ref} was cancelled and its pending shipment allocations were released.`);
      } else if (target.kind === "order") {
        await apiPost(`/sales/orders/${target.item.id}/status`, { status: "Inactive", reason: reason.trim() });
        setNotice(`${target.item.ref} was marked inactive. Its stock reservations were released.`);
      } else if (target.kind === "po") {
        await apiPost(`/procurement/pos/${target.item.id}/status`, { status: "Inactive", reason: reason.trim() });
        setNotice(`${target.item.ref} was marked inactive. Its active production and inspections were stopped.`);
      } else if (target.kind === "stock") {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > target.row.available) {
          throw new Error("Enter a whole quantity within the available stock.");
        }
        await apiPost(`/catalog/products/${id}/stock-disposition`, {
          stockLevelId: target.row.id, quantity, kind: disposition,
          reason: reason.trim(), reference: reference.trim() || null,
        });
        setNotice(`${quantity} units of ${target.row.sku} were recorded as ${disposition.toLowerCase()}.`);
      } else {
        await apiPost(`/catalog/products/${id}/reconcile-stock-cache`, { reason: reason.trim() });
        setNotice("The legacy quantity was reconciled to the physical stock balance.");
      }
      setTarget(null);
      await refresh();
      invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve this blocker.");
      try { await refresh(); } catch { /* keep the actionable error */ }
    } finally {
      setBusy(false);
    }
  };

  const deleteArticle = async () => {
    setBusy(true);
    setError("");
    try {
      await apiDelete(`/catalog/products/${id}`);
      invalidate(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this article.");
      try { await refresh(); } catch { /* keep the actionable error */ }
    } finally {
      setBusy(false);
    }
  };

  const documentsClear = preview && !preview.orders.length && !preview.purchaseOrders.length &&
    !preview.transfers.length && !preview.stockHolds && !preview.shipments.length && !preview.batchAllocated &&
    !preview.batchMismatch && preview.reserved <= preview.batchReserved;
  const canReconcile = documentsClear && preview?.onHand === 0 && preview.legacyMismatch;
  const submitDisabled = busy || reason.trim().length < 3 ||
    ((target?.kind === "order" || target?.kind === "po" || target?.kind === "shipment") && !confirmed) ||
    (target?.kind === "stock" && (!Number.isInteger(quantity) || quantity < 1 || quantity > target.row.available ||
      (disposition === "Return to supplier" && !reference.trim())));

  return <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
      <Dialog.Content onClick={(event) => event.stopPropagation()}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
        onPointerDownOutside={(event) => { if (busy) event.preventDefault(); }}
        className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <Dialog.Title className="text-lg font-bold">Delete article</Dialog.Title>
        <Dialog.Description className="sr-only">Review and resolve linked commitments and inventory before retiring this article.</Dialog.Description>
        {loading && <p className="mt-3 text-sm">Checking linked records…</p>}
        {preview && <div className="mt-3 space-y-5 text-sm">
          <p><strong>{preview.article}</strong> will leave the active catalog when its stock and commitments are resolved. Order, PO, and quality history will remain.</p>

          {preview.shipments.length > 0 && <section>
            <h3 className="font-semibold">Pending shipments</h3>
            <div className="mt-2 space-y-2">{preview.shipments.map((ship) => <div key={ship.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <span>{ship.ref} · {ship.status}</span>
              {ship.canCancel ? <button type="button" disabled={!shipmentAccess.canWrite || busy} onClick={() => choose({ kind: "shipment", item: ship })}
                className="rounded-md border px-3 py-1.5 font-medium disabled:opacity-50">Cancel article shipment</button>
                : <p className="w-full text-amber-800">This shipment includes other articles. Resolve it in Shipments before deletion.</p>}
            </div>)}</div>
          </section>}

          {preview.purchaseOrders.length > 0 && <section>
            <h3 className="font-semibold">Purchase orders</h3>
            <div className="mt-2 space-y-2">{preview.purchaseOrders.map((po) => <div key={po.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <div><a className="font-medium underline" href={`/procurement/pos/${po.id}`}>{po.ref}</a> · {po.status}
                {po.otherLines > 0 && <p className="text-muted-foreground">Contains {po.otherLines} other article line(s).</p>}</div>
              {po.blockReason && <p className="w-full text-amber-800">{po.blockReason}</p>}
              <button type="button" onClick={() => choose({ kind: "po", item: po })}
                disabled={!procurementAccess.canWrite || !po.canMarkInactive || busy}
                title={!procurementAccess.canWrite ? procurementAccess.reason ?? undefined : undefined}
                className="rounded-md border px-3 py-1.5 font-medium disabled:opacity-50">Mark inactive</button>
            </div>)}</div>
          </section>}

          {preview.orders.length > 0 && <section>
            <h3 className="font-semibold">Sales orders</h3>
            <div className="mt-2 space-y-2">{preview.orders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <div><a className="font-medium underline" href={`/sales/orders/${order.id}`}>{order.ref}</a> · {order.status}
                {order.heldUnits ? <p className="text-muted-foreground">{order.heldUnits} reserved units will be released.</p> : null}
                {order.otherLines > 0 && <p className="text-muted-foreground">Contains {order.otherLines} other article line(s).</p>}</div>
              {order.blockReason && <p className="w-full text-amber-800">{order.blockReason}</p>}
              <button type="button" onClick={() => choose({ kind: "order", item: order })}
                disabled={!salesAccess.canWrite || !order.canMarkInactive || busy}
                title={!salesAccess.canWrite ? salesAccess.reason ?? undefined : undefined}
                className="rounded-md border px-3 py-1.5 font-medium disabled:opacity-50">Mark inactive</button>
            </div>)}</div>
          </section>}

          {preview.stockHolds > 0 && <p className="rounded-md bg-amber-50 p-3 text-amber-900">
            {preview.reserved} reserved units across {preview.stockHolds} hold(s). Mark the owning orders inactive to release them.
          </p>}
          {preview.batchMismatch && <p className="rounded-md bg-amber-50 p-3 text-amber-900">Batch lots and warehouse quantities differ. Reconcile these balances before disposing of inventory.</p>}
          {preview.reserved > preview.batchReserved && !preview.stockHolds && <p className="rounded-md bg-amber-50 p-3 text-amber-900">Stock has reservations that need reconciliation before retirement.</p>}
          {preview.transfers.length > 0 && <p className="rounded-md bg-amber-50 p-3 text-amber-900">
            Active transfers need reconciliation before stock disposal: {preview.transfers.map((t, i) =>
              <React.Fragment key={t.id}>{i ? ", " : ""}<a className="underline" href={`/inventory/transfers/${t.id}`}>{t.ref}</a> ({t.status})</React.Fragment>)}.
          </p>}

          {(preview.stockRows.length > 0 || preview.legacyMismatch) && <section>
            <h3 className="font-semibold">Inventory · {preview.onHand} on hand</h3>
            <p className="mt-1 text-muted-foreground">Record a write-off or supplier return for each SKU and location. Quantity changes are audited.</p>
            <div className="mt-2 space-y-2">{preview.stockRows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <div><span className="font-medium">{row.sku}</span>{row.color ? ` · ${row.color}` : ""}{row.size ? ` · ${row.size}` : ""}
                <p className="text-muted-foreground">{row.location} · {row.onHand} on hand · {row.reserved} reserved</p></div>
              <button type="button" onClick={() => choose({ kind: "stock", row })}
                disabled={!inventoryAccess.canWrite || !documentsClear || row.available < 1 || busy}
                title={!inventoryAccess.canWrite ? inventoryAccess.reason ?? undefined : undefined}
                className="rounded-md border px-3 py-1.5 font-medium disabled:opacity-50">Resolve stock</button>
            </div>)}</div>
            {preview.legacyMismatch && <div className="mt-2 rounded-md bg-amber-50 p-3 text-amber-900">
              The legacy quantity does not match the location balances.
              {canReconcile && <button type="button" onClick={() => choose({ kind: "cache" })}
                disabled={!inventoryAccess.canWrite || busy} className="ml-2 font-semibold underline disabled:opacity-50">Reconcile legacy balance</button>}
            </div>}
          </section>}

          {(preview.openStages > 0 || preview.openInspections > 0) && <p className="text-muted-foreground">
            Final retirement will stop {preview.openStages} active T&A stage(s) and {preview.openInspections} inspection(s), keeping their history.
          </p>}
          {!preview.canDelete && <p className="rounded-md bg-amber-50 p-3 text-amber-900">Resolve the remaining stock and active commitments to enable article deletion.</p>}
        </div>}

        {target && <div className="mt-5 space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <h3 className="font-semibold">{target.kind === "stock" ? `Resolve ${target.row.sku} at ${target.row.location}` :
            target.kind === "cache" ? "Reconcile legacy balance" : target.kind === "shipment" ? `Cancel article shipment ${target.item.ref}` : `Mark ${target.item.ref} inactive`}</h3>
          {target.kind === "shipment" && <>
            <p>This cancels the pending shipment containing only this article and releases its shipment allocations.</p>
            <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>I confirm this article shipment should be cancelled.</span></label>
          </>}
          {(target.kind === "order" || target.kind === "po") && <>
            <p>This withdraws the entire {target.kind === "po" ? "PO" : "order"}{target.item.otherLines > 0 ? `, including ${target.item.otherLines} other article line(s)` : ""}. Existing history remains.</p>
            <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>I confirm the entire document is being withdrawn and its customer or supplier commitment has been resolved.</span></label>
          </>}
          {target.kind === "stock" && <>
            <label className="block">Disposition
              <select value={disposition} onChange={(e) => setDisposition(e.target.value)} className="mt-1 w-full rounded-md border bg-white px-3 py-2">
                <option>Write off</option><option>Return to supplier</option>
              </select>
            </label>
            <label className="block">Quantity · {target.row.available} available
              <input type="number" min={1} max={target.row.available} step={1} value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            {disposition === "Return to supplier" && <label className="block">Supplier return reference
              <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80}
                className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>}
            <p className="text-muted-foreground">This records the inventory quantity adjustment and audit trail. Any financial valuation adjustment must be reconciled separately.</p>
          </>}
          {target.kind === "cache" && <p>The physical stock balance is zero. This clears an older cached quantity that still blocks retirement.</p>}
          <label className="block">Reason
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={400} rows={2}
              className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Explain the business reason" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setTarget(null); setError(""); }} className="rounded-md border px-3 py-2">Cancel</button>
            <button type="button" onClick={resolve} disabled={submitDisabled}
              className="rounded-md bg-brand-ink px-3 py-2 font-semibold text-white disabled:opacity-50">
              {busy ? "Saving…" : target.kind === "stock" ? "Record disposition" : target.kind === "cache" ? "Reconcile balance" : target.kind === "shipment" ? "Cancel article shipment" : "Mark inactive"}
            </button>
          </div>
        </div>}
        {notice && <p role="status" className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
        {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md border px-4 py-2 text-sm">Close</button>
          {preview?.canDelete && <button type="button" disabled={busy || !!target} onClick={deleteArticle}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Working…" : "Delete article"}
          </button>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
