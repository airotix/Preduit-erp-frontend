"use client";
import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Button } from "@/components/ui/button";
import { STAGE_NAMES } from "./production-start-modal";

export type BatchMode = "production" | "quality" | "shipments" | "inventory" | "overview";
type Totals = { ordered: number; planned: number; completed: number; approved: number; held: number; rejected: number; received: number; awaitingQC: number; allocated: number; dispatched: number; delivered: number; available: number; remaining: number; readyToShip: number; inboundPending: number; inboundTransit: number; inboundDelivered: number };
type Lot = { id: number; location: string; available: number };
export type Line = Totals & { id: number; sourceId: number; productionLineId: number | null; productionLinePublicId: string | null; tnaComplete: boolean; name: string; color: string | null; size: string | null; lots: Lot[] };
export type Stage = { id: number; productionLineId: number | null; name: string; status: string; worker: string; notes: string; startOn: string | null; endOn: string | null; durationDays: number; actualStartOn: string | null; actualEndOn: string | null; overdue: boolean };
type History = { kind: string; actor: string; at: string; inspectionId?: string; details: Record<string, unknown> };
export type Batch = { publicId: string; name: string; orderRef: string; poRef: string; factory: string; dueOn: string; status: string; productionStatus: string; qualityStatus: string; shipmentStatus: string; tnaComplete: boolean; tnaProgress: number; summary: Totals; lines: Line[]; stages: Stage[]; history: History[] };
type Ship = { publicId: string; ref: string; status: string; direction: "Inbound" | "Outbound"; carrier: string; destination: string; qty: number; sources: { allocationId: number; batchId: string | null; batch: string; item: string; color: string; size: string; location: string; qty: number; accepted?: number; status: string }[]; history: { kind: string; actor: string; at: string; reason: string }[] };
export type Data = { ref: string; summary: Totals; sources: { id: number; name: string; color: string; size: string; remainingToPlan: number }[]; batches: Batch[]; shipments: Ship[]; locations: { id: number; name: string }[]; productionOrders: { publicId: string; ref: string }[]; inventorySources: { reservationId: number; name: string; color: string; size: string; location: string; available: number }[] };
type Send = (path: string, body: Record<string, unknown>) => Promise<boolean>;
type Commands = { send: Send; busy: boolean };
const field = "w-full rounded-md border bg-white px-3 py-2 text-sm";
const item = (line: { name: string; color?: string | null; size?: string | null }) => [line.name, line.color, line.size].filter(Boolean).join(" / ");
const qty = (form: FormData, name: string) => Number(form.get(name) ?? 0);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

function useCommands() {
  const client = useQueryClient();
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const pending = React.useRef(new Map<string, string>());
  const send: Send = async (path, body) => {
    if (busy) return false;
    const signature = JSON.stringify([path, body]);
    const requestId = pending.current.get(signature) ?? crypto.randomUUID();
    pending.current.set(signature, requestId); setBusy(true); setError(""); setNotice("");
    try {
      await apiPost(path, { ...body, requestId }); pending.current.delete(signature);
      await client.invalidateQueries(); setNotice("Saved. Batch progress is updated across modules."); return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this action"); return false; }
    finally { setBusy(false); }
  };
  return { send, busy, error, notice };
}

function Input({ name, label, type = "text", value, max, min = 1, required = true }: { name: string; label: string; type?: string; value?: string | number; max?: number; min?: number; required?: boolean }) {
  return <label className="block text-sm">{label}<input name={name} type={type} required={required} defaultValue={value} min={type === "number" ? min : undefined} max={max} step={type === "number" ? 1 : undefined} maxLength={type === "text" ? 400 : undefined} className={field} /></label>;
}

function Summary({ data, mode }: { data: Totals; mode: BatchMode }) {
  const fields: [string, keyof Totals][] = mode === "production" ? [["Planned", "planned"], ["Produced", "completed"]] : mode === "quality" ? [["Produced", "completed"], ["Awaiting QC", "awaitingQC"], ["Approved", "approved"], ["Hold / rework", "held"], ["Scrapped", "rejected"]] : [["QC approved", "approved"], ["Ready for inbound shipment", "readyToShip"], ["Inbound pending", "inboundPending"], ["Inbound in transit", "inboundTransit"], ["Accepted inbound delivery", "inboundDelivered"], ["Received stock", "received"], ["Available warehouse stock", "available"], ["Outbound allocated", "allocated"], ["Outbound dispatched", "dispatched"], ["Customer delivered", "delivered"]];
  return <dl className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{fields.map(([label, key]) => <div className="rounded-lg bg-muted/40 p-3" key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-bold">{(data[key] ?? 0).toLocaleString()}</dd></div>)}</dl>;
}

function batchStatus(batch: { status: string; productionStatus: string; qualityStatus: string; shipmentStatus: string }, mode: BatchMode) {
  return mode === "production" ? batch.productionStatus : mode === "quality" ? batch.qualityStatus : mode === "shipments" || mode === "inventory" ? batch.shipmentStatus : batch.status;
}

function BatchLinks({ batch }: { batch: Batch }) {
  const production = useModuleAccess("production"), quality = useModuleAccess("quality"), shipping = useModuleAccess("shipments"), inventory = useModuleAccess("inventory");
  return <nav className="my-3 flex flex-wrap gap-4 text-sm">{([["production", "Production / TNA", production], ["quality", "QC / Inspection", quality], ["shipments", "Shipments", shipping], ["inventory", "Warehouse receiving", inventory]] as const).filter(([, , access]) => access.canRead).map(([module, label]) => <Link key={module} className="text-primary underline" href={`/${module}/batches/${batch.publicId}`}>{label}</Link>)}</nav>;
}

function PlanBatch({ orderId, data, send, busy }: Commands & { orderId: string; data: Data }) {
  const access = useModuleAccess("production");
  if (!access.canWrite) return null;
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Plan production batch</summary><form className="mt-4 space-y-3" onSubmit={async (e) => {
    e.preventDefault(); const form = e.currentTarget, f = new FormData(form);
    if (await send(`/batches/orders/${orderId}`, { name: f.get("name"), factory: f.get("factory"), dueOn: f.get("dueOn") || null, startOn: localToday(), stages: STAGE_NAMES, durations: [0, 2, 2, 3, 10, 3, 1], reason: f.get("reason"), lines: data.sources.map((s) => ({ sourceId: s.id, qty: qty(f, `qty-${s.id}`) })).filter((l) => l.qty > 0) })) form.reset();
  }}><fieldset disabled={busy} className="space-y-3">
    <Input name="name" label="Batch name" /><Input name="factory" label="Factory" required={false} />
    <Input name="dueOn" label="Target completion date" type="date" required={false} />
    <p className="text-xs text-muted-foreground">Set each style’s stage durations when starting its production timeline.</p>
    {data.sources.map((s) => <Input key={s.id} name={`qty-${s.id}`} label={`${item(s)} · ${s.remainingToPlan} available to plan`} type="number" min={0} max={Math.max(0, s.remainingToPlan)} value={0} />)}
    <Input name="reason" label="Planning note" /><Button type="submit" disabled={busy}>Create batch</Button>
  </fieldset></form></details>;
}

function TnaStage({ batch, stage, send, busy }: Commands & { batch: Batch; stage: Stage }) {
  const access = useModuleAccess("production");
  return <article className="space-y-3 rounded-lg border p-4">
    <div className="font-semibold">{stage.name} · {stage.status}{stage.overdue && <span className="ml-2 text-red-700">Overdue</span>}</div>
    <p className="text-sm">Planned: {stage.startOn || "Unscheduled"} → {stage.endOn || "Unscheduled"} · {stage.durationDays} days · {stage.worker || "Unassigned"}</p>
    <p className="text-xs">Actual: {stage.actualStartOn || "Not started"} → {stage.actualEndOn || "Not completed"}</p>{stage.notes && <p className="text-xs">{stage.notes}</p>}
    {stage.status !== "Completed" && access.canWrite && <>
      <details><summary className="cursor-pointer text-sm">Plan dates / assign worker</summary><form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send(`/batches/${batch.publicId}/stages/${stage.id}/schedule`, { startOn: f.get("startOn"), durationDays: qty(f, "durationDays"), worker: f.get("worker"), reason: f.get("reason") }); }}><fieldset disabled={busy} className="contents"><Input name="startOn" label="Start date" type="date" value={stage.startOn || localToday()} /><Input name="durationDays" label="Duration (days)" type="number" max={365} value={stage.durationDays} /><Input name="worker" label="Worker" value={stage.worker || ""} required={false} /><Input name="reason" label="Planning reason" /><Button type="submit" disabled={busy}>Save TNA plan</Button></fieldset></form></details>
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send(`/batches/${batch.publicId}/stages/${stage.id}`, { status: f.get("status"), worker: stage.worker || "", reason: f.get("reason") }); }}><fieldset disabled={busy || !stage.startOn} className="contents"><label className="text-sm">Progress<select name="status" className={field}><option>In progress</option><option>Completed</option></select></label><Input name="reason" label="Progress note" /><Button type="submit" disabled={busy || !stage.startOn}>Update TNA stage</Button></fieldset></form>
      {stage.endOn && <details><summary className="cursor-pointer text-sm">Extend stage and move following dates</summary><form className="mt-3 grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send(`/batches/${batch.publicId}/stages/${stage.id}/extend`, { days: qty(f, "days"), reason: f.get("reason") }); }}><fieldset disabled={busy} className="contents"><Input name="days" label="Extra days" type="number" max={365} /><Input name="reason" label="Extension reason" /><Button type="submit" disabled={busy}>Extend TNA</Button></fieldset></form></details>}
    </>}
  </article>;
}

function LineAction({ batch, line, mode, send, busy }: Commands & { batch: Batch; line: Line; mode: BatchMode }) {
  const production = useModuleAccess("production"), quality = useModuleAccess("quality");
  const [qcKind, setKind] = React.useState("Final");
  if (mode !== "production" && mode !== "quality") return null;
  const qc = mode === "quality", allowed = qc ? quality.canWrite : production.canWrite;
  const blocked = qc ? qcKind !== "Inline" && !line.tnaComplete : !line.tnaComplete;
  return <details className="mt-3 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">{qc ? "Record batch inspection" : "Record produced quantities"}</summary><form className="mt-3 space-y-3" onSubmit={async (e) => {
    e.preventDefault(); const form = e.currentTarget, f = new FormData(form);
    const body = qc ? { reason: f.get("reason"), kind: qcKind, assessed: qty(f, "assessed"), sampleSize: qty(f, "sampleSize"), approved: qty(f, "approved"), held: qty(f, "held"), rejected: qty(f, "rejected") } : { qty: qty(f, "qty"), reason: f.get("reason") };
    if (await send(`/batches/${batch.publicId}/lines/${line.id}/${qc ? "qc" : "complete"}`, body)) form.reset();
  }}><fieldset disabled={busy || !allowed} className="space-y-3">
    {qc ? <><label className="text-sm">Inspection type<select className={field} value={qcKind} onChange={(e) => setKind(e.target.value)}><option>Final</option><option>Inline</option><option>Reinspection</option></select></label><p className="text-xs">{qcKind === "Inline" ? "Inline observations are recorded without releasing stock." : qcKind === "Reinspection" ? `${line.held} held pieces eligible.` : `${line.awaitingQC} completed pieces awaiting QC.`} Sample size is separate from assessed lot quantity.</p><div className="grid gap-3 sm:grid-cols-3">{[["assessed", "Lot quantity assessed"], ["sampleSize", "Sample size"], ...(qcKind === "Inline" ? [] : [["approved", "Approved"], ["held", "Hold / rework"], ["rejected", "Rejected / scrap"]])].map(([name, label]) => <Input key={name} name={name} label={label} type="number" min={name === "assessed" || name === "sampleSize" ? 1 : 0} value={0} />)}</div></> : <Input name="qty" label="Produced quantity" type="number" max={line.planned-line.completed} />}
    {blocked && <p className="text-sm text-amber-700">Complete this batch's TNA first.</p>}<Input name="reason" label={qc ? "Inspection findings / reference" : "Production reference"} /><Button type="submit" disabled={busy || !allowed || blocked}>Save {qc ? "inspection" : "production"}</Button>
  </fieldset></form></details>;
}

function InboundForm({ data, orderId, send, busy }: Commands & { data: Data; orderId: string }) {
  const access = useModuleAccess("shipments");
  const sources = data.batches.filter((b) => b.status !== "Cancelled").flatMap((batch) => batch.lines.filter((l) => l.readyToShip > 0).map((line) => ({ batch, line })));
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Create inbound factory-to-warehouse shipment</summary><form className="mt-4 space-y-3" onSubmit={async (e) => {
    e.preventDefault(); const form = e.currentTarget, f = new FormData(form);
    if (await send(`/batches/orders/${orderId}/inbound-shipments`, { carrier: f.get("carrier"), eta: f.get("eta"), reason: f.get("reason"), allocations: sources.map(({ line }) => ({ lineId: line.id, qty: qty(f, `qty-${line.id}`), locationId: qty(f, "locationId") })).filter((a) => a.qty > 0) })) form.reset();
  }}><fieldset disabled={busy || !access.canWrite} className="space-y-3"><p className="text-sm">Only quantities approved by QC with completed TNA are eligible. Stock is added on confirmed warehouse delivery.</p>
    {sources.map(({ batch, line }) => <Input key={line.id} name={`qty-${line.id}`} label={`${batch.name} · ${item(line)} · ${line.readyToShip} eligible`} type="number" min={0} max={line.readyToShip} value={0} />)}
    {!sources.length && <p>No batches are ready for inbound shipment.</p>}<label className="text-sm">Receiving warehouse<select name="locationId" required className={field}><option value="">Select warehouse</option>{data.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label><Input name="carrier" label="Carrier" /><Input name="eta" label="ETA" required={false} /><Input name="reason" label="Shipment plan / reference" /><Button type="submit" disabled={busy || !access.canWrite || !sources.length}>Save pending inbound shipment</Button>
  </fieldset></form></details>;
}

function OutboundForm({ data, orderId, kind, send, busy }: Commands & { data: Data; orderId: string; kind: string }) {
  const access = useModuleAccess("shipments");
  const lots = data.batches.flatMap((b) => b.lines.flatMap((line) => line.lots.filter((lot) => lot.available > 0).map((lot) => ({ lot, line, batch: b }))));
  if (!lots.length && !data.inventorySources.length) return null;
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Create outbound customer shipment</summary><form className="mt-4 space-y-3" onSubmit={async (e) => {
    e.preventDefault(); const form = e.currentTarget, f = new FormData(form);
    if (await send(`/batches/orders/${orderId}/shipments?kind=${kind}`, { carrier: f.get("carrier"), destination: f.get("destination"), eta: f.get("eta"), reason: f.get("reason"), allocations: lots.map(({ lot }) => ({ lotId: lot.id, qty: qty(f, `lot-${lot.id}`) })).filter((a) => a.qty > 0), inventoryAllocations: data.inventorySources.map((s) => ({ reservationId: s.reservationId, qty: qty(f, `stock-${s.reservationId}`) })).filter((a) => a.qty > 0) })) form.reset();
  }}><fieldset disabled={busy || !access.canWrite} className="space-y-3"><p className="text-sm">Uses stock already received at the warehouse. Dispatch reduces inventory; customer delivery does not add stock.</p>{lots.map(({ lot, batch, line }) => <Input key={lot.id} name={`lot-${lot.id}`} label={`${batch.name} · ${item(line)} · ${lot.location} · ${lot.available} available`} type="number" min={0} max={lot.available} value={0} />)}{data.inventorySources.map((s) => <Input key={s.reservationId} name={`stock-${s.reservationId}`} label={`Existing ${item(s)} · ${s.location} · ${s.available} available`} type="number" min={0} max={s.available} value={0} />)}<Input name="carrier" label="Carrier" /><Input name="destination" label="Customer destination" /><Input name="eta" label="ETA" required={false} /><Input name="reason" label="Dispatch plan / reference" /><Button type="submit" disabled={busy || !access.canWrite}>Save pending outbound shipment</Button></fieldset></form></details>;
}

function BatchTransfer({ batch, line, locations, send, busy }: Commands & { batch: Batch; line: Line; locations: Data["locations"] }) {
  const inventory = useModuleAccess("inventory");
  if (!line.lots.some((l) => l.available > 0) || batch.status === "Cancelled") return null;
  return <details className="mt-3 rounded-lg border p-3"><summary className="cursor-pointer text-sm">Transfer received stock: {item(line)}</summary><form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send(`/batches/${batch.publicId}/lots/${f.get("lotId")}/transfer`, { qty: qty(f, "qty"), locationId: qty(f, "locationId"), reason: f.get("reason") }); }}><fieldset disabled={busy || !inventory.canWrite} className="space-y-3"><label className="text-sm">Source batch lot<select name="lotId" required className={field}>{line.lots.filter((l) => l.available > 0).map((l) => <option key={l.id} value={l.id}>{l.location} · {l.available} transferable</option>)}</select></label><label className="text-sm">Destination warehouse<select name="locationId" required className={field}><option value="">Select location</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label><Input name="qty" label="Transfer quantity" type="number" /><Input name="reason" label="Transfer reference" /><Button type="submit" disabled={busy || !inventory.canWrite}>Transfer stock</Button></fieldset></form></details>;
}

function ShipmentCard({ ship, send, busy, warehouse = false }: Commands & { ship: Ship; warehouse?: boolean }) {
  const access = useModuleAccess("shipments"), inventory = useModuleAccess("inventory");
  const [action, setAction] = React.useState(ship.status === "Pending" ? "In transit" : "Delivered");
  const inbound = ship.direction === "Inbound";
  const actions = warehouse ? inbound && ["In transit", "Customs", "Out for delivery"].includes(ship.status) ? ["Delivered"] : [] : ship.status === "Pending" ? ["In transit", "Cancelled"] : ship.status === "In transit" ? ["Customs", "Out for delivery", "Delivered"] : ship.status === "Customs" ? ["Out for delivery", "Delivered"] : ship.status === "Out for delivery" ? ["Delivered"] : [];
  if (!inbound && !["Pending", "Cancelled", "Returned"].includes(ship.status) && inventory.canWrite && ship.sources.every((s) => s.batchId)) actions.push("Returned");
  const selected = actions.includes(action) ? action : actions[0];
  const allowed = inbound && selected === "Delivered" ? inventory.canWrite : access.canWrite;
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">{ship.ref} · {ship.direction} · {ship.qty} pieces · {ship.status}</summary><p className="my-2 text-sm">{ship.carrier} → {ship.destination}</p>{ship.sources.map((s) => <div key={s.allocationId} className="text-sm">{s.batch} · {s.batchId && <Link className="text-primary underline" href={`/shipments/batches/${s.batchId}`}>{s.batchId}</Link>} · {[s.item, s.color, s.size].filter(Boolean).join(" / ")} · {s.location} · {s.qty} shipped{inbound && ship.status === "Delivered" ? ` / ${s.accepted} accepted` : ""}</div>)}
    {actions.length > 0 && <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void send(`/batches/shipments/${ship.publicId}/status`, { status: selected, reason: f.get("reason"), ...(inbound && selected === "Delivered" ? { accepted: ship.sources.map((s) => ({ allocationId: s.allocationId, qty: qty(f, `accepted-${s.allocationId}`) })) } : {}) }); }}><label className="text-sm">Action<select className={field} value={selected} disabled={busy || (warehouse ? !inventory.canWrite : !access.canWrite && !inventory.canWrite)} onChange={(e) => setAction(e.target.value)}>{actions.map((s) => <option key={s} value={s}>{s === "In transit" ? inbound ? "Confirm factory dispatch" : "Confirm warehouse dispatch" : s === "Delivered" && inbound ? "Confirm warehouse delivery & accepted quantities" : s}</option>)}</select></label>
      {inbound && selected === "Delivered" && <><p className="text-sm">Confirm physically received and accepted quantities. Discrepancies go to hold for reconciliation. Inventory is added once.</p>{ship.sources.map((s) => <Input key={s.allocationId} name={`accepted-${s.allocationId}`} label={`Accepted: ${s.batch} / ${s.item} / ${s.color || ""} / ${s.size || ""}`} type="number" min={0} max={s.qty} value={s.qty} />)}</>}
      <fieldset disabled={busy || !allowed} className="space-y-3"><Input name="reason" label="Reference / reason" /><Button type="submit" disabled={busy || !allowed}>Record shipment action</Button></fieldset>{!allowed && <p className="text-xs text-muted-foreground">{inbound && selected === "Delivered" ? "Warehouse write access is required to confirm accepted delivery quantities." : "Shipment write access is required."}</p>}
    </form>}<details className="mt-3"><summary className="cursor-pointer text-sm">Shipment history</summary>{ship.history.map((h, i) => <p key={i} className="mt-2 text-xs">{h.kind} · {new Date(h.at).toLocaleString()} · {h.actor} · {h.reason}</p>)}</details></details>;
}

export function BatchWorkspace({ orderId, kind = "production", mode, batchId }: { orderId: string; kind?: "production" | "sales" | "procurement"; mode?: BatchMode; batchId?: string }) {
  const owner = mode ?? (kind === "production" ? "production" : "overview");
  const { data: all, error, isLoading } = useQuery({ queryKey: ["batches", kind, orderId], queryFn: () => apiGet<Data>(`/batches/orders/${orderId}?kind=${kind}`), enabled: USE_BACKEND, refetchInterval: 30000 });
  const commands = useCommands(), production = useModuleAccess("production");
  if (!USE_BACKEND) return null;
  const data = all && batchId ? { ...all, batches: all.batches.filter((b) => b.publicId === batchId), shipments: all.shipments.filter((s) => s.sources.some((a) => a.batchId === batchId)), inventorySources: [] } : all;
  return <section className="my-4 space-y-4 rounded-xl border bg-white p-5" aria-label={`${owner} batch tracking`}><h2 className="text-lg font-bold">{owner === "production" ? "Production batches & TNA" : owner === "quality" ? "Batch QC & inspections" : owner === "shipments" ? "Batch shipment tracking" : owner === "inventory" ? "Batch warehouse receiving" : "Batch progress"}</h2>
    <p className="text-sm text-muted-foreground">One parent PO, independently tracked batches. Each Batch ID stays the same across Production, Quality and Shipments.</p>
    {isLoading && <p>Loading batches…</p>}{(error || commands.error) && <p role="alert" className="text-destructive">{commands.error || String(error)}</p>}{commands.notice && <p role="status" className="text-green-700">{commands.notice}</p>}
    {data && <>{!batchId && <><Summary data={data.summary} mode={owner} />{owner === "production" ? <PlanBatch orderId={orderId} data={data} {...commands} /> : data.productionOrders.map((w) => <Link key={w.publicId} className="block text-sm text-primary underline" href={`/production/porders/${w.publicId}`}>Production order {w.ref}</Link>)}</>}
      {data.batches.map((b) => <details open={!!batchId} id={`batch-${b.publicId}`} key={b.publicId} className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">{b.name} · {b.poRef} · {b.summary.planned} pieces · {batchStatus(b, owner)}</summary><p className="mt-3 break-all font-mono text-xs">Batch ID: {b.publicId}</p><p className="text-sm">Parent PO: {b.poRef} · Production order: {b.orderRef} · Factory: {b.factory || "Unassigned"} · Target: {b.dueOn || "Not set"}</p><BatchLinks batch={b} /><p className="text-sm font-semibold">{owner === "quality" ? `${b.summary.completed} produced · ${b.summary.awaitingQC} awaiting QC · ${b.summary.approved} approved · ${b.summary.held} held` : owner === "shipments" || owner === "inventory" ? `${b.summary.readyToShip} ready to ship · ${b.summary.inboundTransit} inbound in transit · ${b.summary.received} received` : `${b.summary.planned} planned · ${b.summary.completed} produced · TNA ${b.tnaProgress}%`}</p><Summary data={b.summary} mode={owner} />
        {owner === "production" && b.status !== "Cancelled" && <div className="space-y-3"><h3 className="font-semibold">Time & Action timeline</h3><div className="flex flex-wrap gap-2">{b.stages.map((s) => <span key={s.id} className={`rounded border px-3 py-2 text-xs ${s.status === "Completed" ? "bg-green-50" : s.overdue ? "bg-red-50" : "bg-muted/30"}`}>{s.name} · {s.status}</span>)}</div>{b.stages.map((s) => <TnaStage key={s.id} batch={b} stage={s} {...commands} />)}</div>}
        {b.lines.map((line) => <article key={line.id} className="mt-4 border-t pt-3"><h4 className="font-medium">{item(line)}</h4><p className="text-xs">{owner === "quality" ? `Produced ${line.completed} · Awaiting QC ${line.awaitingQC} · Approved ${line.approved} · Hold ${line.held} · Scrap ${line.rejected}` : owner === "shipments" || owner === "inventory" ? `QC approved ${line.approved} · Ready to ship ${line.readyToShip} · Received ${line.received}` : `Planned ${line.planned} · Produced ${line.completed}`}</p>{b.status !== "Cancelled" && <LineAction batch={b} line={line} mode={owner} {...commands} />}</article>)}
        {owner === "inventory" && b.lines.map((line) => <BatchTransfer key={line.id} batch={b} line={line} locations={data.locations} {...commands} />)}
        {owner === "production" && production.canWrite && b.status !== "Cancelled" && b.summary.completed === 0 && <details className="mt-3"><summary className="cursor-pointer text-sm">Cancel batch plan</summary><form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); void commands.send(`/batches/${b.publicId}/cancel`, { reason: new FormData(e.currentTarget).get("reason") }); }}><Input name="reason" label="Cancellation reason" /><Button type="submit" disabled={commands.busy}>Cancel batch</Button></form></details>}
        <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">{owner === "quality" ? "Inspection history" : "Batch history"}</summary>{b.history.filter((h) => owner !== "quality" || h.kind === "QC").map((h, i) => <div key={i} className="mt-2 rounded bg-muted/30 p-2 text-xs"><strong>{h.kind}</strong> · {new Date(h.at).toLocaleString()} · {h.actor || "System"}{h.inspectionId && <p><Link className="text-primary underline" href={`/quality/inspections/${h.inspectionId}`}>Open inspection {h.inspectionId}</Link></p>}<p>{String(h.details.reason || "")}</p><p>{Object.entries(h.details).filter(([k]) => ["qty", "assessed", "sampleSize", "approved", "held", "rejected", "kind", "worker"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p></div>)}</details>
      </details>)}{!data.batches.length && <p>No batches planned yet.</p>}
      {owner === "shipments" && batchId && <Link className="block text-sm text-primary underline" href={`/shipments/orders/${orderId}`}>Manage shipments across this PO's batches</Link>}
      {owner === "shipments" && kind === "production" && data.batches.length > 0 && <InboundForm data={data} orderId={orderId} {...commands} />}{owner === "shipments" && <OutboundForm data={data} orderId={orderId} kind={kind} {...commands} />}
      {owner === "overview" && data.productionOrders.map((w) => <Link className="block text-sm text-primary underline" key={w.publicId} href={`/shipments/orders/${w.publicId}`}>Manage inbound shipments for {w.ref}</Link>)}{owner === "overview" && kind === "sales" && <Link className="block text-sm text-primary underline" href={`/shipments/orders/${orderId}?kind=sales`}>Manage customer shipments</Link>}
      {(owner === "shipments" || owner === "inventory" || owner === "overview") && <><h3 className="font-semibold">Linked shipments</h3>{data.shipments.map((s) => owner === "shipments" || owner === "inventory" && s.direction === "Inbound" ? <ShipmentCard key={s.publicId} ship={s} warehouse={owner === "inventory"} {...commands} /> : <Link key={s.publicId} href={`/shipments/shipments/${s.publicId}`} className="block text-sm text-primary underline">{s.ref} · {s.direction} · {s.status}</Link>)}</>}
    </>}
  </section>;
}

export function BatchShipmentPanel({ shipmentId }: { shipmentId: string }) {
  const { data, error } = useQuery({ queryKey: ["batches", "shipment", shipmentId], queryFn: () => apiGet<Ship | null>(`/batches/shipments/${shipmentId}`), enabled: USE_BACKEND, refetchInterval: 30000 });
  const commands = useCommands();
  if (error) return <p role="alert">{String(error)}</p>;
  if (!data) return null;
  return <section className="my-4 space-y-3 rounded-xl border bg-white p-5"><h2 className="font-bold">{data.direction} shipment · batch sources</h2><ShipmentCard ship={data} {...commands} />{commands.error && <p role="alert" className="text-destructive">{commands.error}</p>}{commands.notice && <p role="status">{commands.notice}</p>}</section>;
}

export function BatchWorkList({ kind }: { kind: "production" | "quality" | "shipments" | "inventory" }) {
  const { data, error } = useQuery({ queryKey: ["batches", "work", kind], queryFn: () => apiGet<{ batches: { publicId: string; name: string; orderId: string; orderRef: string; poRef: string; status: string; productionStatus: string; qualityStatus: string; shipmentStatus: string; planned: number; completed: number; awaitingQC: number; held: number; readyToShip: number; received: number; tnaComplete: boolean }[] }>(`/batches/work/${kind}`), enabled: USE_BACKEND, refetchInterval: 30000 });
  if (!USE_BACKEND) return null;
  return <section className="mb-4 rounded-xl border bg-white p-4"><h2 className="mb-3 font-bold">{kind === "quality" ? "Batch QC work" : kind === "shipments" ? "Batch shipment tracking" : kind === "inventory" ? "Batch warehouse receiving" : "Production batches"}</h2>{error && <p role="alert">{String(error)}</p>}<div className="max-h-80 space-y-2 overflow-auto">{data?.batches.map((b) => <Link key={b.publicId} href={`/${kind}/batches/${b.publicId}`} className="block rounded-lg border p-3 text-sm"><strong>{b.name} · {b.poRef} · {b.orderRef} · {batchStatus(b, kind)}</strong><div>{kind === "quality" ? `Produced ${b.completed} · Awaiting QC ${b.awaitingQC} · Hold ${b.held}` : kind === "shipments" || kind === "inventory" ? `Ready for inbound shipment ${b.readyToShip} · Received ${b.received}` : `Planned ${b.planned} · Produced ${b.completed} · TNA ${b.tnaComplete ? "Complete" : "In progress"}`}</div><div className="break-all font-mono text-xs">Batch ID: {b.publicId}</div></Link>)}{data && !data.batches.length && <p className="text-sm text-muted-foreground">No batches in this queue.</p>}</div></section>;
}

/** The main production order owns the plan; batches appear as its suborders. */
export function ProductionSuborders({ orderId }: { orderId: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["batches", "production", orderId],
    queryFn: () => apiGet<Data>(`/batches/orders/${orderId}?kind=production`),
    enabled: USE_BACKEND,
    refetchInterval: 30000,
  });
  const commands = useCommands();
  if (!USE_BACKEND) return null;
  return <section className="my-4 space-y-4 rounded-xl border bg-white p-5" aria-label="Production suborders">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold">Production suborders</h2><p className="text-sm text-muted-foreground">Plan batches against this order and run each batch through its own production timeline.</p></div>
      {data && <span className="text-sm font-semibold">Planned {data.summary.planned} · Produced {data.summary.completed}</span>}
    </div>
    {isLoading && <p>Loading batches…</p>}
    {(error || commands.error) && <p role="alert" className="text-destructive">{commands.error || String(error)}</p>}
    {commands.notice && <p role="status">{commands.notice}</p>}
    {data && <>
      {data.batches.length > 0 && <div className="space-y-2">{data.batches.map((batch, index) =>
        <Link key={batch.publicId} href={`/production/batches/${batch.publicId}`} className="block rounded-lg border p-4 transition-colors hover:bg-muted/30">
          <div className="flex flex-wrap items-center justify-between gap-2"><strong>{batch.name || `Batch ${index + 1}`} · {batch.orderRef}</strong><span className="text-sm font-semibold">{batch.productionStatus}</span></div>
          <p className="mt-1 text-sm text-muted-foreground">{batch.summary.planned} planned · {batch.summary.completed} produced · TNA {batch.tnaProgress}%</p>
        </Link>)}</div>}
      <PlanBatch orderId={orderId} data={data} {...commands} />
    </>}
  </section>;
}
