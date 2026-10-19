"use client";

import * as React from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Button } from "@/components/ui/button";

type Line = { id: string; po: string; supplier: string; sku: string; name: string; color: string; size: string; price: string; returnable: number;
  lots: { id: string; locationId: number; onHand: number; allocated: number }[] };
type Options = { lines: Line[]; locations: { id: string; internalId: number; name: string }[];
  legacy: { id: string; sku: string; quantity: number; locationId: number; reference: string }[] };
type Return = { id: string; ref: string; po: string; poId: string; supplier: string; sku: string; quantity: number; amount: string;
  resolution: string; status: string; reference: string; reason: string; creditReference: string | null; refundReference: string | null;
  inspectionId: string | null; inspectionResult: string | null; bills: { id: string; ref: string }[];
  actor: string; createdAt: string; events: { action: string; actor: string; at: string; data: { reference: string; reason: string } }[] };
type Action = { row: Return; kind: "credit" | "refund" | "replacement" | "resolution" };
const input = "mt-1 w-full rounded-md border bg-white p-2 text-sm";

export function SupplierReturns() {
  const procurement = useModuleAccess("procurement");
  const inventory = useModuleAccess("inventory");
  const finance = useModuleAccess("finance");
  const qc = useQueryClient();
  const [offset, setOffset] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState<Action | null>(null);
  const [form, setForm] = React.useState({ poLineId: "", locationId: "", lotId: "", legacyMovementId: "", quantity: "1", resolution: "Credit", reference: "", reason: "" });
  const [details, setDetails] = React.useState({ billId: "", channel: "bank", reference: "", reason: "", resolution: "Credit" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const request = React.useRef<{ key: string; id: string } | null>(null);
  const options = useQuery({ queryKey: ["supplier-return-options"], queryFn: () => apiGet<Options>("/procurement/supplier-returns/options"), enabled: procurement.canRead });
  const data = useQuery({ queryKey: ["supplier-returns", offset], queryFn: () => apiGet<{ rows: Return[]; total: number }>(`/procurement/supplier-returns?limit=50&offset=${offset}`), enabled: procurement.canRead });
  const line = options.data?.lines.find((l) => l.id === form.poLineId);
  const location = options.data?.locations.find((l) => l.id === form.locationId);
  const lots = line?.lots.filter((lot) => lot.locationId === location?.internalId) ?? [];
  const submit = async () => {
    setBusy(true); setError("");
    try {
      const path = action ? `/procurement/supplier-returns/${action.row.id}/${action.kind}` : "/procurement/supplier-returns";
      const body = action ? {
        reference: details.reference, reason: details.reason,
        ...(action.kind === "credit" ? { billId: details.billId } : action.kind === "refund" ? { channel: details.channel } : action.kind === "resolution" ? { resolution: details.resolution } : {}),
      } : { ...form, quantity: Number(form.quantity), lotId: form.lotId || null, legacyMovementId: form.legacyMovementId || null };
      const key = JSON.stringify({ path, body });
      if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
      await apiPost(path, { ...body, requestId: request.current.id });
      request.current = null; setOpen(false); setAction(null);
      setForm({ poLineId: "", locationId: "", lotId: "", legacyMovementId: "", quantity: "1", resolution: "Credit", reference: "", reason: "" });
      await qc.invalidateQueries();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not record supplier return."); }
    finally { setBusy(false); }
  };
  const start = (row: Return, kind: Action["kind"]) => {
    setError(""); setAction({ row, kind });
    setDetails({ billId: row.bills.length === 1 ? row.bills[0].id : "", channel: "bank", reference: "", reason: "", resolution: "Credit" });
  };
  if (!procurement.canRead) return <p className="p-6">Procurement access is required.</p>;
  return <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Supplier returns</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Track goods returned against a source PO through supplier credit, refund or replacement. Warehouse movements, QC and Finance confirmations are recorded separately.</p></div>
      <Button disabled={!procurement.canWrite || !inventory.canWrite || !options.data} onClick={() => { setError(""); setOpen(true); }}>Record return</Button>
    </div>
    <div className="flex flex-wrap gap-4 text-sm"><Link className="underline" href="/procurement/pos">Purchase orders</Link><Link className="underline" href="/finance/supplierledger">Supplier ledger</Link><Link className="underline" href="/quality/inspections">Quality inspections</Link>
      <button className="underline" onClick={() => { data.refetch(); options.refetch(); }}>Refresh</button></div>
    {(data.isError || options.isError) && <p role="alert" className="text-sm text-red-700">{data.error?.message || options.error?.message}</p>}
    {data.isPending && <p>Loading returns…</p>}
    {data.data?.rows.length === 0 && <p className="rounded-xl border p-6 text-sm text-muted-foreground">No supplier returns recorded.</p>}
    {data.data?.rows.map((row) => <section key={row.id} className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{row.ref} · {row.supplier}</h2><span className="text-sm font-semibold">{row.status}</span></div>
      <p className="text-sm"><Link className="underline" href={`/procurement/pos/${row.poId}`}>{row.po}</Link> · {row.sku} · {row.quantity} units · EUR {row.amount} · {row.resolution}</p>
      <p className="text-sm text-muted-foreground">{row.reference} · {row.reason}</p>
      <p className="text-xs text-muted-foreground">Recorded by {row.actor} · {new Date(row.createdAt).toLocaleString()}</p>
      {row.creditReference && <p className="text-sm">Supplier credit: {row.creditReference}{row.refundReference ? ` · Refund: ${row.refundReference}` : ""}</p>}
      {row.inspectionId && <p className="text-sm"><Link className="underline" href={`/quality/inspections/${row.inspectionId}`}>Replacement QC: {row.inspectionResult}</Link></p>}
      {row.status !== "Closed" && <div className="flex flex-wrap gap-2">
        {row.resolution !== "Replacement" && !row.creditReference && <Button variant="outline" disabled={!finance.canWrite} onClick={() => start(row, "credit")}>Finance: confirm supplier credit</Button>}
        {row.status === "Awaiting refund" && <Button variant="outline" disabled={!finance.canWrite} onClick={() => start(row, "refund")}>Finance: record refund received</Button>}
        {row.resolution === "Replacement" && <Button variant="outline" disabled={!inventory.canWrite || !procurement.canWrite || row.inspectionResult !== "Pass"} onClick={() => start(row, "replacement")}>Receive QC-passed replacement</Button>}
        <Button variant="outline" disabled={!finance.canWrite} onClick={() => start(row, "resolution")}>Resolve as credit or refund</Button>
      </div>}
      {!!row.events.length && <details className="rounded border p-3 text-sm"><summary>Resolution history</summary><div className="mt-2 space-y-2">{row.events.map((e, i) => <p key={i}>{e.action} · {e.actor} · {new Date(e.at).toLocaleString()}<br />{e.data.reference} · {e.data.reason}</p>)}</div></details>}
    </section>)}
    {!!data.data?.total && <div className="flex items-center justify-between gap-3 text-sm"><span>{offset + 1}–{Math.min(offset + 50, data.data.total)} of {data.data.total}</span><div className="flex gap-2"><Button variant="outline" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}>Previous</Button><Button variant="outline" disabled={offset + 50 >= data.data.total} onClick={() => setOffset(offset + 50)}>Next</Button></div></div>}
    <Dialog.Root open={open || !!action} onOpenChange={(value) => { if (!value && !busy) { setOpen(false); setAction(null); } }}><Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(94vw,600px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
        <Dialog.Title className="text-lg font-bold">{action ? `${action.row.ref} · ${action.kind === "credit" ? "Confirm supplier credit" : action.kind === "refund" ? "Record refund received" : action.kind === "resolution" ? "Change supplier resolution" : "Receive replacement"}` : "Record return to supplier"}</Dialog.Title>
        <Dialog.Description className="my-3 text-sm text-muted-foreground">{action?.kind === "credit" ? `This posts a supplier credit of EUR ${action.row.amount} against the original payable. Confirm the supplier's document before posting.` : action?.kind === "refund" ? `Confirm EUR ${action.row.amount} has actually been received. This records the cash/bank movement.` : action?.kind === "replacement" ? `Receive all ${action.row.quantity} replacement units at the original warehouse after the linked QC passed. No new bill is created.` : action?.kind === "resolution" ? "Record the supplier's agreed change. Existing stock movements and inspection history are retained." : "Confirm the goods have physically left the warehouse. Select their source PO, SKU and location; quantity is deducted once."}</Dialog.Description>
        <fieldset disabled={busy} className="space-y-3 text-sm">
          {!action && <>
            <label className="block">Source PO / SKU<select className={input} value={form.poLineId} onChange={(e) => setForm({ ...form, poLineId: e.target.value, lotId: "", legacyMovementId: "" })}><option value="">Choose received PO line</option>{options.data?.lines.map((l) => <option key={l.id} value={l.id}>{l.po} · {l.supplier} · {l.sku} · {l.color} {l.size} · {l.returnable} returnable</option>)}</select></label>
            <label className="block">Warehouse<select className={input} value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value, lotId: "", legacyMovementId: "" })}><option value="">Choose warehouse</option>{options.data?.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
            {!!lots.length && <label className="block">Source batch lot<select className={input} value={form.lotId} onChange={(e) => setForm({ ...form, lotId: e.target.value })}><option value="">Ordinary unreserved stock</option>{lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.id.slice(0, 8)} · {lot.onHand - lot.allocated} available</option>)}</select></label>}
            <label className="block">Quantity<input className={input} type="number" min={1} step={1} max={line?.returnable} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
            <label className="block">Resolution<select className={input} value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })}><option>Credit</option><option>Refund</option><option disabled={!!form.legacyMovementId}>Replacement</option></select></label>
            {line && <p>Return value: EUR {(Number(line.price) * Number(form.quantity || 0)).toFixed(2)} from saved PO prices.</p>}
            <details className="rounded border p-3"><summary>Link an older stock return already recorded</summary><p className="my-2 text-xs text-muted-foreground">This links the exact historical movement without removing stock again. Batch replacement stock requires a new traced return.</p>
              <select aria-label="Historical stock return" className={input} value={form.legacyMovementId} onChange={(e) => { const old = options.data?.legacy.find((l) => l.id === e.target.value); setForm({ ...form, legacyMovementId: e.target.value, lotId: "", resolution: old && form.resolution === "Replacement" ? "Credit" : form.resolution, quantity: old ? String(old.quantity) : form.quantity }); }}><option value="">New physical return</option>{options.data?.legacy.filter((l) => l.sku === line?.sku && l.locationId === location?.internalId).map((l) => <option key={l.id} value={l.id}>{l.reference} · {l.quantity} units</option>)}</select>
            </details>
          </>}
          {action?.kind === "credit" && <label className="block">Original payable<select className={input} value={details.billId} onChange={(e) => setDetails({ ...details, billId: e.target.value })}><option value="">Choose payable</option>{action.row.bills.map((b) => <option key={b.id} value={b.id}>{b.ref}</option>)}</select></label>}
          {action?.kind === "refund" && <label className="block">Received into<select className={input} value={details.channel} onChange={(e) => setDetails({ ...details, channel: e.target.value })}><option value="bank">Bank</option><option value="cash">Cash</option></select></label>}
          {action?.kind === "resolution" && <label className="block">Agreed resolution<select className={input} value={details.resolution} onChange={(e) => setDetails({ ...details, resolution: e.target.value })}><option>Credit</option>{!action.row.creditReference && <option>Refund</option>}</select></label>}
          <label className="block">{action?.kind === "credit" ? "Supplier credit-note reference" : action?.kind === "refund" ? "Bank / cash receipt reference" : "Reference"}<input maxLength={80} className={input} value={action ? details.reference : form.reference} onChange={(e) => action ? setDetails({ ...details, reference: e.target.value }) : setForm({ ...form, reference: e.target.value })} /></label>
          <label className="block">Reason<textarea maxLength={400} className={input} value={action ? details.reason : form.reason} onChange={(e) => action ? setDetails({ ...details, reason: e.target.value }) : setForm({ ...form, reason: e.target.value })} /></label>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => { setOpen(false); setAction(null); }}>Back</Button><Button disabled={busy || (action ? !details.reference.trim() || details.reason.trim().length < 3 || (action.kind === "credit" && !details.billId) : !form.poLineId || !form.locationId || !form.reference.trim() || form.reason.trim().length < 3 || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0)} onClick={submit}>{busy ? "Saving…" : "Confirm"}</Button></div>
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
  </div>;
}
