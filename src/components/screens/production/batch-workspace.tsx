"use client";
import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Button } from "@/components/ui/button";

type Totals = { ordered: number; planned: number; completed: number; approved: number; held: number; rejected: number; received: number; awaitingQC: number; allocated: number; dispatched: number; delivered: number; available: number; remaining: number };
type Lot = { id: number; location: string; onHand: number; allocated: number; available: number };
type Line = Totals & { id: number; sourceId: number; variantId: number; salesOrderLineId: number | null; name: string; color: string | null; size: string | null; lots: Lot[] };
type Batch = { publicId: string; name: string; orderRef: string; factory: string; dueOn: string; status: string; summary: Totals; lines: Line[]; stages: { id: number; name: string; status: string; worker: string }[]; history: { kind: string; actor: string; at: string; details: Record<string, unknown> }[] };
type Ship = { history: { kind: string; actor: string; at: string; reason: string }[]; publicId: string; ref: string; status: string; carrier: string; destination: string; qty: number; sources: { allocationId: number; batchId: string; batch: string; item: string; color: string; size: string; location: string; qty: number; status: string }[] };
type Data = { inventorySources: { reservationId: number; name: string; color: string; size: string; location: string; available: number }[]; ref: string; summary: Totals; sources: { id: number; name: string; color: string; size: string; remainingToPlan: number }[]; batches: Batch[]; shipments: Ship[]; locations: { id: number; name: string }[]; productionOrders: { publicId: string; ref: string }[] };
type Send = (path: string, body: Record<string, unknown>) => Promise<boolean>;
const field = "w-full rounded-md border bg-white px-3 py-2 text-sm";
const number = (value: FormDataEntryValue | null) => Number(value ?? 0);
const item = (line: { name: string; color?: string | null; size?: string | null }) => [line.name, line.color, line.size].filter(Boolean).join(" / ");

function useCommands() {
  const client = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const pending = React.useRef(new Map<string, string>());
  const send: Send = async (path, body) => {
    if (busy) return false;
    const signature = JSON.stringify([path, body]);
    const requestId = pending.current.get(signature) ?? crypto.randomUUID();
    pending.current.set(signature, requestId);
    setBusy(true); setError(""); setNotice("");
    try {
      await apiPost(path, { ...body, requestId });
      pending.current.delete(signature);
      await Promise.all(["batches", "screen", "production", "sales", "inventory", "detail", "shipment"].map((key) => client.invalidateQueries({ queryKey: [key] })));
      setNotice("Saved. Quantities and history updated.");
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this action"); return false; }
    finally { setBusy(false); }
  };
  return { send, busy, error, notice };
}

function Summary({ data, parent = false }: { data: Totals; parent?: boolean }) {
  const fields: [string, keyof Totals][] = [...(parent ? [["Ordered", "ordered"], ["Remaining to dispatch", "remaining"]] as [string, keyof Totals][] : []),
    ["Produced", "completed"], ["QC approved", "approved"], ["Awaiting QC", "awaitingQC"], ["On hold / rework", "held"],
    ["Scrapped", "rejected"], ["Received", "received"], ["Available to ship", "available"], ["Pending shipments", "allocated"], ["Dispatched", "dispatched"], ["Delivered", "delivered"]];
  return <dl className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{fields.map(([label, key]) => <div className="rounded-lg bg-muted/40 p-3" key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-bold">{(data[key] ?? 0).toLocaleString()}</dd></div>)}</dl>;
}

function PlanBatch({ orderId, data, send, busy }: { orderId: string; data: Data; send: Send; busy: boolean }) {
  const access = useModuleAccess("production");
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Plan production batch</summary>
    <form className="mt-4 space-y-3" onSubmit={async (event) => {
      event.preventDefault(); const form = event.currentTarget; const f = new FormData(form);
      const success = await send(`/batches/orders/${orderId}`, { name: f.get("name"), factory: f.get("factory"), dueOn: f.get("dueOn") || null,
        stages: String(f.get("stages")).split(",").map((s) => s.trim()).filter(Boolean), reason: f.get("reason"),
        lines: data.sources.map((s) => ({ sourceId: s.id, qty: number(f.get(`qty-${s.id}`)) })).filter((l) => l.qty > 0) });
      if (success) form.reset();
    }}>
      <fieldset disabled={busy || !access.canWrite} className="space-y-3">
        <label className="block text-sm">Batch name<input name="name" required maxLength={120} className={field} placeholder="Batch 1" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Factory<input name="factory" maxLength={120} className={field} /></label><label className="text-sm">Target completion date<input name="dueOn" type="date" className={field} /></label></div>
        <label className="block text-sm">Production stages, in order<input name="stages" required className={field} defaultValue="Cutting, Sewing, Finishing, Packing" /></label>
        {data.sources.map((s) => <label key={s.id} className="grid items-center gap-2 text-sm sm:grid-cols-[1fr_120px]"><span>{item(s)} · {s.remainingToPlan.toLocaleString()} available to plan</span><input aria-label={`Plan ${item(s)}`} name={`qty-${s.id}`} type="number" min={0} max={Math.max(0, s.remainingToPlan)} step={1} defaultValue={0} className={field} /></label>)}
        <label className="block text-sm">Planning note<input name="reason" required maxLength={400} className={field} /></label>
        <Button type="submit" disabled={busy || !access.canWrite}>Create batch</Button>
      </fieldset>
    </form>
  </details>;
}

function Stage({ batch, stage, send, busy }: { batch: Batch; stage: Batch["stages"][number]; send: Send; busy: boolean }) {
  const access = useModuleAccess("production");
  return <form className="flex flex-wrap items-end gap-2 rounded-lg border p-3" onSubmit={(e) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    void send(`/batches/${batch.publicId}/stages/${stage.id}`, { status: f.get("status"), worker: f.get("worker"), reason: f.get("reason") });
  }}><div className="mr-auto"><div className="font-medium">{stage.name}</div><div className="text-xs">{stage.status}</div></div>
    {stage.status !== "Completed" && <fieldset disabled={busy || !access.canWrite} className="flex flex-wrap items-end gap-2">
      <label className="text-xs">Worker<input name="worker" defaultValue={stage.worker || ""} maxLength={120} className={field} /></label>
      <label className="text-xs">Note<input name="reason" required maxLength={400} className={field} /></label>
      <label className="text-xs">Stage status<select name="status" className={field}><option>In progress</option><option>Completed</option></select></label>
      <Button type="submit" size="sm" disabled={busy || !access.canWrite}>Save stage</Button>
    </fieldset>}
  </form>;
}

function LineActions({ batch, line, locations, send, busy }: { batch: Batch; line: Line; locations: Data["locations"]; send: Send; busy: boolean }) {
  const production = useModuleAccess("production"), quality = useModuleAccess("quality"), inventory = useModuleAccess("inventory");
  const [action, setAction] = React.useState("complete");
  const [qcKind, setQCKind] = React.useState("Final");
  const allowed = action === "complete" ? production.canWrite : action === "qc" ? quality.canWrite : inventory.canWrite;
  return <details className="mt-3 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Record production, QC or warehouse quantities</summary>
    <form className="mt-3 space-y-3" onSubmit={async (e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      const body: Record<string, unknown> = { reason: f.get("reason") };
      if (action === "qc") Object.assign(body, { kind: qcKind, assessed: number(f.get("assessed")), sampleSize: number(f.get("sampleSize")), approved: number(f.get("approved")), held: number(f.get("held")), rejected: number(f.get("rejected")) });
      else Object.assign(body, { qty: number(f.get("qty")), locationId: action === "complete" ? null : number(f.get("locationId")) });
      const path = action === "transfer" ? `/batches/${batch.publicId}/lots/${f.get("lotId")}/transfer` : `/batches/${batch.publicId}/lines/${line.id}/${action}`;
      if (await send(path, body)) form.reset();
    }}>
      <label className="block text-sm">Action<select value={action} onChange={(e) => setAction(e.target.value)} className={field} disabled={busy}>
        <option value="complete">Record completed production</option><option value="qc">Record QC result</option><option value="receive">Receive approved stock</option><option value="transfer">Transfer batch stock</option>
      </select></label>
      <fieldset disabled={busy || !allowed} className="space-y-3">
        {action === "qc" ? <>
          <label className="block text-sm">Inspection type<select value={qcKind} onChange={(e) => setQCKind(e.target.value)} className={field}><option>Final</option><option>Inline</option><option>Reinspection</option></select></label>
          <p className="text-xs text-muted-foreground">{qcKind === "Inline" ? "Inline findings do not release stock for shipping." : qcKind === "Reinspection" ? `${line.held} held pieces eligible for reinspection.` : `${line.awaitingQC} completed pieces awaiting final QC.`} Sample size is separate from the assessed lot quantity.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{["assessed", "sampleSize", "approved", "held", "rejected"].map((key) => <label className="text-sm" key={key}>{({ assessed: "Lot quantity assessed", sampleSize: "Sample size", approved: "Approved", held: "Hold / rework", rejected: "Rejected / scrap" } as Record<string, string>)[key]}<input name={key} required type="number" min={key === "assessed" || key === "sampleSize" ? 1 : 0} step={1} defaultValue={0} className={field} /></label>)}</div>
        </> : <label className="block text-sm">Quantity<input name="qty" required type="number" min={1} step={1} className={field} max={action === "complete" ? line.planned-line.completed : action === "receive" ? line.approved-line.received : undefined} /></label>}
        {action === "transfer" && <label className="block text-sm">Source batch lot<select name="lotId" required className={field}><option value="">Select lot</option>{line.lots.map((l) => <option key={l.id} value={l.id}>{l.location} · {l.available} transferable</option>)}</select></label>}
        {(action === "receive" || action === "transfer") && <label className="block text-sm">{action === "receive" ? "Receiving location" : "Destination location"}<select name="locationId" required className={field}><option value="">Select location</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}
        <label className="block text-sm">Reason / reference<input name="reason" required maxLength={400} className={field} /></label>
        <Button type="submit" disabled={busy || !allowed}>Save quantities</Button>
      </fieldset>
      {!allowed && <p className="text-xs text-muted-foreground">Your role cannot record this action.</p>}
    </form>
  </details>;
}

function ShipmentForm({ data, orderId, kind, send, busy }: { data: Data; orderId: string; kind: string; send: Send; busy: boolean }) {
  const access = useModuleAccess("shipments");
  const [quantities, setQuantities] = React.useState<Record<number, number>>({});
  const [inventoryQuantities, setInventoryQuantities] = React.useState<Record<number, number>>({});
  const groups: Record<string, { title: string; lots: (Lot & { batch: string })[] }> = {};
  for (const b of data.batches) for (const line of b.lines) {
    const key = `${line.variantId}-${line.salesOrderLineId ?? "stock"}`;
    const group = groups[key] ??= { title: item(line), lots: [] };
    for (const lot of line.lots) if (lot.available > 0) group.lots.push({ ...lot, batch: b.name });
  }
  const lots = Object.values(groups).flatMap((g) => g.lots);
  const total = lots.reduce((sum, l) => sum + (quantities[l.id] || 0), 0) + data.inventorySources.reduce((sum, s) => sum + (inventoryQuantities[s.reservationId] || 0), 0);
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Create shipment batch</summary>
    <form className="mt-4 space-y-3" onSubmit={async (e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      if (await send(`/batches/orders/${orderId}/shipments?kind=${kind}`, { carrier: f.get("carrier"), destination: f.get("destination"), eta: f.get("eta"), reason: f.get("reason"), allocations: lots.map((l) => ({ lotId: l.id, qty: quantities[l.id] || 0 })).filter((a) => a.qty > 0), inventoryAllocations: data.inventorySources.map((s) => ({ reservationId: s.reservationId, qty: inventoryQuantities[s.reservationId] || 0 })).filter((a) => a.qty > 0) })) { setQuantities({}); setInventoryQuantities({}); form.reset(); }
    }}><fieldset disabled={busy || !access.canWrite} className="space-y-3">
      {Object.entries(groups).filter(([, g]) => g.lots.length).map(([key, g]) => <div className="rounded-lg bg-muted/30 p-3" key={key}>
        <label className="grid gap-2 text-sm sm:grid-cols-[1fr_120px]"><span>{g.title} · {g.lots.reduce((s, l) => s+l.available, 0)} available</span><input aria-label={`Ship ${g.title}`} type="number" min={0} step={1} max={g.lots.reduce((s, l) => s+l.available, 0)} value={g.lots.reduce((s, l) => s+(quantities[l.id] || 0), 0)} className={field} onChange={(e) => {
          let remaining = Number(e.target.value); const next = { ...quantities }; for (const l of g.lots) { next[l.id] = Math.max(0, Math.min(l.available, remaining)); remaining -= next[l.id]; } setQuantities(next);
        }} /></label>
        <details className="mt-2"><summary className="cursor-pointer text-xs">Source batches · adjust suggested allocations</summary>{g.lots.map((l) => <label key={l.id} className="mt-2 grid items-center gap-2 text-sm sm:grid-cols-[1fr_120px]"><span>{l.batch} · {l.location} · {l.available} available</span><input aria-label={`Allocate ${g.title} from ${l.batch} at ${l.location}`} type="number" min={0} step={1} max={l.available} value={quantities[l.id] || 0} onChange={(e) => setQuantities((q) => ({ ...q, [l.id]: Number(e.target.value) }))} className={field} /></label>)}</details>
      </div>)}
      {data.inventorySources.length > 0 && <div className="rounded-lg border p-3"><h4 className="text-sm font-semibold">Existing reserved inventory</h4><p className="text-xs text-muted-foreground">Select pieces already reserved for this order at each warehouse.</p>{data.inventorySources.map((s) => <label key={s.reservationId} className="mt-2 grid gap-2 text-sm sm:grid-cols-[1fr_120px]"><span>{item(s)} · {s.location} · {s.available} available</span><input aria-label={`Ship existing ${item(s)} from ${s.location}`} type="number" min={0} step={1} max={s.available} value={inventoryQuantities[s.reservationId] || 0} onChange={(e) => setInventoryQuantities((q) => ({ ...q, [s.reservationId]: Number(e.target.value) }))} className={field} /></label>)}</div>}
      {!lots.length && !data.inventorySources.length && <p className="text-sm">Receive QC-approved stock before creating a shipment.</p>}
      <div className="grid gap-3 sm:grid-cols-2">{["carrier", "destination", "eta"].map((key) => <label className="text-sm" key={key}>{key === "eta" ? "ETA" : key === "carrier" ? "Carrier" : "Destination"}<input name={key} required={key !== "eta"} maxLength={key === "destination" ? 160 : key === "eta" ? 40 : 120} className={field} /></label>)}</div>
      <label className="block text-sm">Dispatch plan / reference<input name="reason" required maxLength={400} className={field} /></label>
      <p className="text-sm font-semibold">{total.toLocaleString()} pieces allocated. Saving reserves stock; confirm dispatch when it leaves the warehouse.</p>
      <Button type="submit" disabled={busy || !access.canWrite || total <= 0}>Save pending shipment</Button>
    </fieldset></form>
  </details>;
}

function ShipmentCard({ ship, send, busy }: { ship: Ship; send: Send; busy: boolean }) {
  const access = useModuleAccess("shipments");
  const inventory = useModuleAccess("inventory");
  const active = !["Returned", "Cancelled"].includes(ship.status);
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">{ship.ref} · {ship.qty.toLocaleString()} pieces · {ship.status}</summary>
    <p className="my-2 text-sm">{ship.carrier} → {ship.destination} · <Link href={`/shipments/shipments/${ship.publicId}`} className="text-primary underline">Open shipment</Link></p>
    <div className="space-y-1 text-sm">{ship.sources.map((s) => <div key={s.allocationId}>{s.batch} · {[s.item, s.color, s.size].filter(Boolean).join(" / ")} · {s.location} · {s.qty.toLocaleString()} pieces ({s.status})</div>)}</div>
    <details className="mt-3"><summary className="cursor-pointer text-sm">Shipment history</summary>{ship.history.map((h, i) => <div key={i} className="mt-2 text-xs">{h.kind} · {new Date(h.at).toLocaleString()} · {h.actor}<div>{h.reason}</div></div>)}</details>
    {active && <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send(`/batches/shipments/${ship.publicId}/status`, { status: f.get("status"), reason: f.get("reason") }); }}>
      <label className="text-xs">Action<select name="status" className={field} disabled={busy || !access.canWrite}>
        {ship.status === "Pending" ? <><option value="In transit">Confirm dispatch</option><option value="Cancelled">Cancel pending shipment</option></> : <>{(ship.status === "In transit" ? ["Customs", "Out for delivery", "Delivered"] : ship.status === "Customs" ? ["Out for delivery", "Delivered"] : ship.status === "Delivered" ? [] : ["Delivered"]).map((s) => <option key={s}>{s}</option>)}{inventory.canWrite && ship.sources.every((s) => s.batchId) && <option value="Returned">Confirm all pieces physically returned — QC hold</option>}</>}
      </select></label><label className="text-xs">Reference / reason<input name="reason" required maxLength={400} disabled={busy || !access.canWrite} className={field} /></label><Button type="submit" size="sm" disabled={busy || !access.canWrite}>Record action</Button>
    </form>}
  </details>;
}

export function BatchWorkspace({ orderId, kind = "production" }: { orderId: string; kind?: "production" | "sales" | "procurement" }) {
  const { data, error, isLoading } = useQuery({ queryKey: ["batches", kind, orderId], queryFn: () => apiGet<Data>(`/batches/orders/${orderId}?kind=${kind}`), enabled: USE_BACKEND });
  const commands = useCommands();
  const productionAccess = useModuleAccess("production");
  React.useEffect(() => {
    if (!data || !window.location.hash) return;
    const element = document.getElementById(window.location.hash.slice(1));
    if (element instanceof HTMLDetailsElement) { element.open = true; element.scrollIntoView({ block: "start" }); }
  }, [data]);
  if (!USE_BACKEND) return null;
  return <section className="my-4 space-y-4 rounded-xl border bg-white p-5" aria-label="Production batches and shipments">
    <h2 className="text-lg font-bold">Production batches & shipments</h2>
    {isLoading && <p>Loading batch quantities…</p>}{error && <p role="alert" className="text-sm text-destructive">{String(error)}</p>}
    {commands.error && <p role="alert" className="text-sm text-destructive">{commands.error}</p>}{commands.notice && <p role="status" className="text-sm text-green-700">{commands.notice}</p>}
    {data && <><Summary data={data.summary} parent />
      <p className="text-sm text-muted-foreground">Production, QC and warehouse quantities are recorded separately. Each shipment retains its source batches.</p>
      {kind === "production" ? <PlanBatch orderId={orderId} data={data} {...commands} /> : <div className="flex flex-wrap gap-3">{data.productionOrders.map((w) => <Link key={w.publicId} href={`/production/porders/${w.publicId}`} className="text-sm font-semibold text-primary underline">Plan batches in {w.ref}</Link>)}</div>}
      <div className="space-y-3">{data.batches.map((b) => <details id={`batch-${b.publicId}`} key={b.publicId} className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">{b.name} · {b.orderRef} · {b.summary.planned.toLocaleString()} pieces · {b.status}</summary>
        <p className="mt-2 text-sm">Factory: {b.factory || "Unassigned"} · Target: {b.dueOn || "Not set"}</p><Summary data={b.summary} />
        {b.status !== "Cancelled" && <details><summary className="cursor-pointer text-sm font-semibold">Production stages</summary><div className="mt-2 space-y-2">{b.stages.map((s) => <Stage key={s.id} batch={b} stage={s} {...commands} />)}</div></details>}
        {b.lines.map((l) => <div key={l.id} className="mt-4 border-t pt-3"><h4 className="font-medium">{item(l)}</h4><p className="text-xs">Planned {l.planned} · Produced {l.completed} · Approved {l.approved} · Hold {l.held} · Scrap {l.rejected} · Received {l.received} · Dispatched {l.dispatched}</p>{b.status !== "Cancelled" && <LineActions batch={b} line={l} locations={data.locations} {...commands} />}</div>)}
        {b.status !== "Cancelled" && b.summary.completed === 0 && productionAccess.canWrite && <details className="mt-3"><summary className="cursor-pointer text-sm">Cancel this batch plan</summary><form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); void commands.send(`/batches/${b.publicId}/cancel`, { reason: new FormData(e.currentTarget).get("reason") }); }}><label className="text-xs">Cancellation reason<input name="reason" required maxLength={400} className={field} disabled={commands.busy} /></label><Button type="submit" variant="outline" size="sm" disabled={commands.busy}>Cancel batch</Button></form></details>}
        <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Batch history</summary>{b.history.map((h, i) => <div key={i} className="mt-2 rounded bg-muted/30 p-2 text-xs"><strong>{h.kind}</strong> · {new Date(h.at).toLocaleString()} · {h.actor || "System"}<div>{String(h.details.reason || "")}</div><div>{Object.entries(h.details).filter(([k]) => ["qty", "assessed", "sampleSize", "approved", "held", "rejected", "kind", "status", "worker"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div></div>)}</details>
        <div className="mt-3 space-y-1 text-sm">{data.shipments.filter((s) => s.sources.some((a) => a.batchId === b.publicId)).map((s) => <Link key={s.publicId} href={`/shipments/shipments/${s.publicId}`} className="block text-primary underline">{s.ref} · {s.status}</Link>)}</div>
      </details>)}{!data.batches.length && <p className="text-sm text-muted-foreground">No production batches planned yet.</p>}</div>
      {data.batches.length > 0 && <ShipmentForm data={data} orderId={orderId} kind={kind} {...commands} />}
      <h3 className="font-bold">Shipment history</h3>{data.shipments.map((s) => <ShipmentCard key={s.publicId} ship={s} {...commands} />)}
    </>}
  </section>;
}

export function BatchShipmentPanel({ shipmentId }: { shipmentId: string }) {
  const { data } = useQuery({ queryKey: ["batches", "shipment", shipmentId], queryFn: () => apiGet<Ship | null>(`/batches/shipments/${shipmentId}`), enabled: USE_BACKEND });
  const commands = useCommands();
  if (!data) return null;
  return <section className="my-4 rounded-xl border bg-white p-5"><h2 className="mb-3 font-bold">Batch sources & dispatch</h2><ShipmentCard ship={data} {...commands} />{commands.error && <p role="alert" className="text-destructive">{commands.error}</p>}{commands.notice && <p role="status">{commands.notice}</p>}</section>;
}

export function BatchWorkList({ kind }: { kind: "production" | "quality" }) {
  const { data, error } = useQuery({ queryKey: ["batches", "work", kind], queryFn: () => apiGet<{ batches: { publicId: string; name: string; orderId: string; orderRef: string; status: string; planned: number; completed: number; awaitingQC: number; held: number }[] }>(kind === "quality" ? "/batches/quality-work" : "/batches/work/production"), enabled: USE_BACKEND });
  if (!USE_BACKEND || (!error && !data?.batches.length)) return null;
  return <section className="mb-4 rounded-xl border bg-white p-4"><h2 className="mb-3 font-bold">{kind === "quality" ? "Batch QC work" : "Production batches"}</h2>{error && <p role="alert">{String(error)}</p>}<div className="max-h-80 space-y-2 overflow-auto">{data?.batches.map((b) => <Link key={b.publicId} href={`/batch-work/${b.publicId}#batch-${b.publicId}`} className="block rounded-lg border p-3 text-sm"><strong>{b.name} · {b.orderRef}</strong> · {b.status}<div>Planned {b.planned} · Produced {b.completed} · Awaiting QC {b.awaitingQC} · Hold {b.held}</div></Link>)}</div></section>;
}
