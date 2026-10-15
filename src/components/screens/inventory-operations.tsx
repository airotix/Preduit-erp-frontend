"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { useAuth } from "@/lib/auth";

type Option = { id: string; label: string };
type List<T> = { items: T[]; total: number };
type Options = { variants: Option[]; locations: Option[]; suppliers: Option[]; counters: Option[] };
type Event = { action: string; actor: string; at: string; data: { reason: string; override?: boolean;
  snapshot?: { label: string; book: number; count: number | null; recount: number | null }[] } };
const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50";
const button = "rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-40";
const cell = "px-4 py-3 text-left text-sm border-b border-border/50";
const card = "rounded-xl border border-border bg-background p-5 space-y-4";

function Select({ title, options, value, onChange, required = true }: { title: string; options: Option[]; value: string;
  onChange: (value: string) => void; required?: boolean }) {
  return <label className="block space-y-1 text-sm font-medium">{title}<select className={field} value={value} required={required}
    onChange={e => onChange(e.target.value)}><option value="">Choose {title.toLowerCase()}</option>
    {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
}
function NumberField({ title, value, onChange, min = 0 }: { title: string; value: number; onChange: (n: number) => void; min?: number }) {
  return <label className="block space-y-1 text-sm font-medium">{title}<input className={field} type="number" required min={min}
    step="1" value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function History({ events }: { events: Event[] }) {
  return <details className={card}><summary className="cursor-pointer text-sm font-semibold">Action history ({events.length})</summary>
    {events.map((e, i) => <div key={i} className="border-t border-border pt-3 text-sm"><strong>{e.action}</strong>
      <p className="text-muted-foreground">{e.actor} · {new Date(e.at).toLocaleString()}</p><p>{e.data.reason}
        {e.data.override && " · Administrator review override"}</p>
      {e.data.snapshot && <details className="mt-2"><summary className="cursor-pointer text-xs">Recorded count snapshot</summary>
        {e.data.snapshot.map((l, j) => <p key={j} className="mt-1 text-xs text-muted-foreground">{l.label} · book {l.book} · count {l.count ?? "—"} · recount {l.recount ?? "—"}</p>)}</details>}</div>)}</details>;
}
function useWrite() {
  const client = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pending = React.useRef<{ key: string; id: string } | null>(null);
  const send = async <T,>(path: string, body: object): Promise<T | null> => {
    const key = JSON.stringify({ path, body });
    if (!pending.current || pending.current.key !== key) pending.current = { key, id: crypto.randomUUID() };
    setBusy(true); setError(null);
    try {
      const result = await apiPost<T>(path, { ...body, requestId: pending.current.id });
      pending.current = null;
      await client.invalidateQueries();
      return result;
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this action"); return null; }
    finally { setBusy(false); }
  };
  return { send, busy, error };
}
function Page({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <section className="mx-auto max-w-[1500px] space-y-6 p-6"><header><p className="text-xs uppercase tracking-widest text-muted-foreground">Inventory operations</p>
    <h1 className="mt-2 text-2xl font-bold">{title}</h1><p className="mt-2 max-w-4xl text-sm text-muted-foreground">{intro}</p></header>{children}</section>;
}
function ErrorText({ error }: { error: unknown }) {
  return error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error instanceof Error ? error.message : String(error)}</p> : null;
}
function Pagination({ offset, total, setOffset }: { offset: number; total: number; setOffset: (offset: number) => void }) {
  return <div className="flex items-center justify-end gap-3 text-sm"><span>{total ? offset + 1 : 0}–{Math.min(offset + 50, total)} of {total}</span>
    <button className={button} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>Previous</button>
    <button className={button} disabled={offset + 50 >= total} onClick={() => setOffset(offset + 50)}>Next</button></div>;
}

type Rule = { id: string; variantId: string; label: string; locationId: string; warehouse: string;
  supplierId: string; supplier: string; minimum: number; target: number; leadDays: number; minimumOrder: number;
  packMultiple: number; active: boolean; available: number; incoming: number; unassigned: number; suggested: number; enabled: boolean; expected: string };
type Plan = { rules: Rule[]; unassigned: { poId: string; po: string; quantity: number; expected: string }[] };
export function ReplenishmentScreen() {
  const access = useModuleAccess("inventory"), procurement = useModuleAccess("procurement");
  const router = useRouter();
  const options = useQuery({ queryKey: ["inventory-operation-options"], queryFn: () => apiGet<Options>("/inventory/operations/options") });
  const plan = useQuery({ queryKey: ["replenishment"], queryFn: () => apiGet<Plan>("/inventory/replenishment") });
  const write = useWrite();
  const [draft, setDraft] = React.useState({ variantId: "", locationId: "", supplierId: "", minimum: 0, target: 10,
    leadDays: 7, minimumOrder: 1, packMultiple: 1, active: true });
  const [assignments, setAssignments] = React.useState<Record<string, string>>({});
  const [search, setSearch] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const o = options.data;
  return <Page title="Replenishment" intro="Set a minimum and target for each colour / size at each warehouse. Proposals include available stock and outstanding stock POs. Sales-linked POs are earmarked for their orders and excluded. Expected receipt dates use supplier lead time.">
    <ErrorText error={write.error || plan.error || options.error} />{notice && <p className="text-sm text-green-700">{notice}</p>}
    <div className="flex flex-wrap gap-3"><input className={`${field} max-w-md`} placeholder="Search rules…" value={search} onChange={e => setSearch(e.target.value)} />
      <button className={button} disabled={!access.canWrite || write.busy} onClick={() => setShowForm(!showForm)}>Configure rule</button></div>
    {showForm && o && <form className={card} onSubmit={async e => { e.preventDefault(); const result = await write.send("/inventory/replenishment/rules", draft);
      if (result) { setNotice("Reorder rule saved."); setShowForm(false); } }}><h2 className="font-semibold">Warehouse reorder rule</h2>
      <div className="grid gap-4 md:grid-cols-3"><Select title="Variant" options={o.variants} value={draft.variantId} onChange={variantId => setDraft({ ...draft, variantId })} />
        <Select title="Warehouse" options={o.locations} value={draft.locationId} onChange={locationId => setDraft({ ...draft, locationId })} />
        <Select title="Supplier" options={o.suppliers} value={draft.supplierId} onChange={supplierId => setDraft({ ...draft, supplierId })} />
        {([['minimum', 'Minimum'], ['target', 'Target'], ['leadDays', 'Lead time (days)'], ['minimumOrder', 'Minimum order'], ['packMultiple', 'Pack multiple']] as const).map(([key, title]) =>
          <NumberField key={key} title={title} value={draft[key]} min={key === "target" || key === "minimumOrder" || key === "packMultiple" ? 1 : 0}
            onChange={n => setDraft({ ...draft, [key]: n })} />)}</div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />Active</label>
      <button className={button} disabled={!access.canWrite || write.busy}>Save rule</button>
      <p className="text-xs text-muted-foreground">Saving the same variant and warehouse updates its existing rule. The target must exceed the minimum.</p></form>}
    {!!plan.data?.unassigned.length && <section className={card}><h2 className="font-semibold">Incoming POs need a warehouse</h2>
      <p className="text-sm text-muted-foreground">Assign these before creating replenishment for their variants.</p>
      {Array.from(new Map(plan.data.unassigned.map(p => [p.poId, p])).values()).map(p => <div key={p.poId} className="flex flex-wrap items-end gap-4 border-t border-border pt-3">
        <Link className="text-sm font-semibold underline" href={`/procurement/pos/${p.poId}`}>{p.po}</Link><div className="min-w-64"><Select title="Incoming warehouse" options={o?.locations ?? []}
          value={assignments[p.poId] ?? ""} onChange={n => setAssignments({ ...assignments, [p.poId]: n })} /></div>
        <button type="button" className={button} disabled={!access.canWrite || !procurement.canWrite || write.busy || !assignments[p.poId]}
          onClick={() => void write.send(`/inventory/replenishment/incoming/${p.poId}/assign`, { locationId: assignments[p.poId], reason: "Assign incoming stock warehouse" })}>Assign</button></div>)}</section>}
    <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full"><thead><tr>{["Variant / warehouse", "Available", "Incoming", "Minimum / target", "Supplier / due", "Suggested", "Actions"].map(t => <th key={t} className={cell}>{t}</th>)}</tr></thead>
      <tbody>{plan.data?.rules.filter(r => `${r.label} ${r.warehouse} ${r.supplier}`.toLowerCase().includes(search.toLowerCase())).map(r => <tr key={r.id}>
        <td className={cell}><strong>{r.label}</strong><p className="text-muted-foreground">{r.warehouse}{!r.active && " · Paused"}</p></td>
        <td className={cell}>{r.available}</td><td className={cell}>{r.incoming}{r.unassigned > 0 && <p className="text-amber-700">+{r.unassigned} unassigned</p>}</td>
        <td className={cell}>{r.minimum} / {r.target}</td><td className={cell}>{r.supplier}<p className="text-muted-foreground">{r.expected} · {r.leadDays} days</p></td>
        <td className={cell}>{r.suggested}</td><td className={cell}><div className="flex gap-2"><button className={button} disabled={!access.canWrite || write.busy} onClick={() => {
          setDraft({ variantId: r.variantId, locationId: r.locationId, supplierId: r.supplierId, minimum: r.minimum, target: r.target,
            leadDays: r.leadDays, minimumOrder: r.minimumOrder, packMultiple: r.packMultiple, active: r.active }); setShowForm(true); }}>Edit</button>
          <button className={button} disabled={!access.canWrite || !procurement.canWrite || write.busy || !r.suggested || !!r.unassigned || !r.enabled}
            onClick={async () => { const result = await write.send<{ id: string }>(`/inventory/replenishment/${r.id}/purchase`, { reason: "Replenish warehouse to configured target" });
              if (result) router.push(`/procurement/pos/${result.id}`); }}>Create PO</button></div></td></tr>)}</tbody></table>
      {plan.isLoading && <p className="p-5 text-sm">Loading live stock…</p>}
      {plan.data && !plan.data.rules.length && <p className="p-5 text-sm text-muted-foreground">No reorder rules yet. Configure a variant and warehouse to start.</p>}</div>
  </Page>;
}

type CountLine = { id: number; label: string; book: number; count: number | null; recount: number | null; effective: number | null; material: boolean };
type Count = { id: string; reference: string; reason: string; warehouse: string; status: string; counter: string; creator: string; lines: CountLine[]; events: Event[] };
export function StocktakesScreen() {
  const access = useModuleAccess("inventory"), router = useRouter(), { user } = useAuth();
  const o = useQuery({ queryKey: ["inventory-operation-options"], queryFn: () => apiGet<Options>("/inventory/operations/options") });
  const [offset, setOffset] = React.useState(0);
  const q = useQuery({ queryKey: ["stocktakes", offset], queryFn: () => apiGet<List<Count>>(`/inventory/stocktakes?limit=50&offset=${offset}`) });
  const write = useWrite();
  const [locationId, setLocation] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [counter, setCounter] = React.useState("");
  const [variants, setVariants] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const counters = [...(o.data?.counters ?? [])];
  if (user?.email && !counters.some(c => c.id === user.email)) counters.push({ id: user.email, label: user.email });
  return <Page title="Stocktakes" intro="Create a warehouse count, assign a counter, and review differences before posting. Counts do not change stock until approved. Significant variances (>5 units or >10%) require a recount and an independent reviewer.">
    <ErrorText error={write.error || q.error || o.error} />
    <details className={card}><summary className="cursor-pointer font-semibold">New stocktake</summary>
      <form className="space-y-4" onSubmit={async e => { e.preventDefault(); const result = await write.send<Count>("/inventory/stocktakes", {
        locationId, reference, reason, counter, variantIds: variants }); if (result) router.push(`/inventory/stocktakes/${result.id}`); }}>
        <div className="grid gap-4 md:grid-cols-2"><Select title="Warehouse" options={o.data?.locations ?? []} value={locationId} onChange={setLocation} />
          <Select title="Assigned counter" options={counters} value={counter} onChange={setCounter} />
          <label className="text-sm font-medium">Reference<input className={field} required minLength={3} maxLength={80} value={reference} onChange={e => setReference(e.target.value)} /></label>
          <label className="text-sm font-medium">Reason<input className={field} required minLength={3} maxLength={400} value={reason} onChange={e => setReason(e.target.value)} /></label></div>
        <p className="text-sm text-muted-foreground">Select variants for a cycle count, or leave none selected to count every stock variant at this warehouse.</p>
        <input className={field} placeholder="Find variants…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-3">{o.data?.variants.filter(v => v.label.toLowerCase().includes(search.toLowerCase())).map(v =>
          <label key={v.id} className="flex gap-3 py-1 text-sm"><input type="checkbox" checked={variants.includes(v.id)} onChange={e => setVariants(e.target.checked ? [...variants, v.id] : variants.filter(id => id !== v.id))} />{v.label}</label>)}</div>
        <button className={button} disabled={write.busy || !access.canWrite}>Create count session ({variants.length || "all"} variants)</button></form></details>
    <div className={card}>{q.isLoading && <p>Loading stocktakes…</p>}{q.data?.items.map(s => <Link key={s.id} href={`/inventory/stocktakes/${s.id}`} className="flex flex-wrap justify-between gap-2 rounded-lg border border-border p-4 text-sm">
      <strong>{s.reference} · {s.warehouse}</strong><span>{s.status} · {s.counter}</span></Link>)}{q.data && !q.data.total && <p className="text-sm text-muted-foreground">No count sessions yet.</p>}</div>
    {q.data && <Pagination offset={offset} total={q.data.total} setOffset={setOffset} />}
  </Page>;
}

export function StocktakeWorkspace({ id }: { id: string }) {
  const access = useModuleAccess("inventory"), { user, hasPermission } = useAuth();
  const q = useQuery({ queryKey: ["stocktake", id], queryFn: () => apiGet<Count>(`/inventory/stocktakes/${id}`) });
  const write = useWrite();
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});
  const [reason, setReason] = React.useState("");
  const [counter, setCounter] = React.useState("");
  const [override, setOverride] = React.useState(false);
  const s = q.data;
  const editable = s?.status === "Counting" || s?.status === "Recount";
  const canCount = access.canWrite && (!user || user.email?.toLowerCase() === s?.counter || hasPermission("admin.write"));
  const closed = s?.status === "Posted" || s?.status === "Cancelled";
  const action = async (kind: string) => {
    const lines = kind === "save" ? (s?.lines ?? []).filter(l => quantities[l.id] !== undefined && quantities[l.id] !== "").map(l => ({ id: l.id, quantity: Number(quantities[l.id]) })) : [];
    const result = await write.send<Count>(`/inventory/stocktakes/${id}/${kind}`, { reason, override, counter: counter || undefined, lines });
    if (result) { setQuantities({}); setReason(""); }
  };
  return <Page title={s?.reference ?? "Stocktake"} intro="Enter actual physical counts. Submit them for review, request a recount if needed, then approve the differences. If stock has moved after this session’s snapshot, restart and count again.">
    <Link className="text-sm underline" href="/inventory/stocktakes">All stocktakes</Link><ErrorText error={write.error || q.error} />
    {s && <><section className={card}><h2 className="font-semibold">{s.warehouse} · {s.status}</h2><p className="text-sm">Assigned: {s.counter} · Created by: {s.creator}</p><p className="text-sm text-muted-foreground">{s.reason}</p></section>
      <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full"><thead><tr>{["Variant", "Snapshot", "Count", "Recount", "Difference", "Enter physical count"].map(t => <th className={cell} key={t}>{t}</th>)}</tr></thead><tbody>{s.lines.map(l => <tr key={l.id}>
        <td className={cell}>{l.label}{l.material && <p className="text-amber-700">Significant variance · recount required</p>}</td><td className={cell}>{l.book}</td><td className={cell}>{l.count ?? "—"}</td>
        <td className={cell}>{l.recount ?? "—"}</td><td className={cell}>{l.effective === null ? "—" : l.effective - l.book}</td>
        <td className={cell}>{editable && <input aria-label={`Physical count for ${l.label}`} className={`${field} max-w-36`} type="number" min="0" step="1" disabled={!canCount || write.busy}
          value={quantities[l.id] ?? ""} onChange={e => setQuantities({ ...quantities, [l.id]: e.target.value })} />}</td></tr>)}</tbody></table></div>
      {!closed && <section className={card}><label className="block text-sm font-medium">Action reason<textarea className={field} minLength={3} maxLength={400} value={reason} onChange={e => setReason(e.target.value)} /></label>
        {s.status === "Submitted" && <><label className="block text-sm">Counter for recount (optional email)<input className={field} type="email" value={counter} onChange={e => setCounter(e.target.value)} /></label>
          {hasPermission("admin.write") && <label className="flex gap-2 text-sm"><input type="checkbox" checked={override} onChange={e => setOverride(e.target.checked)} />Administrator override of independent review (recorded with the reason)</label>}</>}
        <div className="flex flex-wrap gap-3">{editable && <><button className={button} disabled={!canCount || write.busy || reason.trim().length < 3} onClick={() => void action("save")}>Save counts</button>
          <button className={button} disabled={!canCount || write.busy || reason.trim().length < 3 || Object.keys(quantities).length > 0} onClick={() => void action("submit")}>Submit for review</button></>}
          {s.status === "Submitted" && <><button className={button} disabled={!access.canWrite || write.busy || reason.trim().length < 3} onClick={() => void action("recount")}>Request recount</button>
            <button className={button} disabled={!access.canWrite || write.busy || reason.trim().length < 3} onClick={() => void action("post")}>Approve and post differences</button></>}
          <button className={button} disabled={!access.canWrite || write.busy || reason.trim().length < 3} onClick={() => void action("restart")}>Restart count with current stock</button>
          <button className={button} disabled={!access.canWrite || write.busy || reason.trim().length < 3} onClick={() => void action("cancel")}>Cancel session</button></div></section>}
      <History events={s.events} /></>}{q.isLoading && <p>Loading stocktake…</p>}
  </Page>;
}

type ReturnLine = { id: number; label: string; requested: number; cancelled: number; received: number; quarantine: number; ready: number; repair: number; scrap: number; restocked: number };
type Return = { id: string; reference: string; order: string; customer: string; reason: string; refund: string; currency: string;
  status: string; warehouse: string | null; locationId: string | null; legacy: boolean; lines: ReturnLine[]; events: Event[] };
type ReturnOptions = { orders: { id: string; label: string; currency: string; lines: { id: number; label: string; remaining: number }[] }[]; locations: Option[] };
export function ReturnsScreen({ sales = false, quality = false }: { sales?: boolean; quality?: boolean }) {
  const access = useModuleAccess(sales ? "sales" : quality ? "quality" : "inventory"), router = useRouter();
  const base = sales ? "/sales/return-workflow" : quality ? "/quality/returns" : "/inventory/returns";
  const [offset, setOffset] = React.useState(0);
  const [orderSearch, setOrderSearch] = React.useState("");
  const deferredOrderSearch = React.useDeferredValue(orderSearch);
  const q = useQuery({ queryKey: ["returns", base, offset], queryFn: () => apiGet<List<Return>>(`${base}?limit=50&offset=${offset}`) });
  const o = useQuery({ queryKey: ["return-options", deferredOrderSearch], queryFn: () => apiGet<ReturnOptions>(`/sales/return-workflow/options?search=${encodeURIComponent(deferredOrderSearch)}`), enabled: sales });
  const write = useWrite();
  const [orderId, setOrder] = React.useState("");
  const [locationId, setLocation] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [refund, setRefund] = React.useState("0");
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});
  const [search, setSearch] = React.useState("");
  const order = o.data?.orders.find(v => v.id === orderId);
  return <Page title={sales ? "Sales returns" : quality ? "Return QC" : "Customer returns"} intro={sales ? "Authorize quantities from a dispatched sales order. Returned goods are received into quarantine in Inventory and require QC before put-away. Batch shipment returns continue through their shipment Returned and QC workflow." : quality ? "Inspect returned goods held in quarantine. Approve quantities for restock, send units to repair, or scrap them. Reinspect repaired units before approving their return to stock." : "Receive authorized customer returns into quarantine. Quality handles inspection and repair decisions; warehouse put-away makes approved goods available. Requested refunds remain financial metadata and do not post a credit or payment."}>
    <ErrorText error={write.error || q.error || o.error} />
    {sales && <details className={card}><summary className="cursor-pointer font-semibold">Authorize customer return</summary><form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); const lines = order?.lines.filter(l => Number(quantities[l.id] || 0) > 0).map(l => ({ orderLineId: l.id, quantity: Number(quantities[l.id]) })) ?? [];
      const result = await write.send<Return>(base, { orderId, locationId, reason, refund: Number(refund), lines });
      if (result) router.push(`/sales/returns/${result.id}`);
    }}><label className="block text-sm font-medium">Find a dispatched order<input className={field} placeholder="Order number or customer; search older orders here" value={orderSearch}
      onChange={e => { setOrderSearch(e.target.value); setOrder(""); setQuantities({}); }} /></label>
      <div className="grid gap-4 md:grid-cols-2"><Select title="Dispatched order" options={o.data?.orders ?? []} value={orderId} onChange={n => { setOrder(n); setQuantities({}); }} />
      <Select title="Receiving warehouse" options={o.data?.locations ?? []} value={locationId} onChange={setLocation} />
      <label className="text-sm font-medium">Return reason<input className={field} required minLength={3} maxLength={80} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <label className="text-sm font-medium">Requested refund ({order?.currency ?? "amount"})<input className={field} type="number" min="0" step="0.01" required value={refund} onChange={e => setRefund(e.target.value)} /></label></div>
      {order?.lines.map(l => <label className="flex flex-wrap items-center gap-4 text-sm" key={l.id}><span className="flex-1">{l.label} · {l.remaining} returnable</span>
        <input aria-label={`Return quantity for ${l.label}`} type="number" min="0" max={l.remaining} step="1" className={`${field} max-w-32`} value={quantities[l.id] ?? ""} onChange={e => setQuantities({ ...quantities, [l.id]: e.target.value })} /></label>)}
      <button className={button} disabled={!access.canWrite || write.busy}>Authorize return</button>
      <p className="text-xs text-muted-foreground">Only shipped quantities not already authorized for another RMA can be returned. This action does not change stock or issue a refund.</p></form></details>}
    <input className={`${field} max-w-md`} placeholder="Filter this page of returns…" value={search} onChange={e => setSearch(e.target.value)} />
    <div className={card}>{q.isLoading && <p>Loading returns…</p>}{q.data?.items.filter(r => `${r.reference} ${r.order} ${r.customer} ${r.status}`.toLowerCase().includes(search.toLowerCase())).map(r =>
      <Link key={r.id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-border p-4 text-sm" href={`/${sales ? "sales" : quality ? "quality" : "inventory"}/returns/${r.id}`}>
        <span><strong>{r.reference} · {r.order}</strong><p className="text-muted-foreground">{r.customer} · {r.warehouse ?? "No warehouse"}</p></span><span>{r.status}{r.legacy && " · Legacy metadata"}</span></Link>)}
      {q.data && !q.data.total && <p className="text-sm text-muted-foreground">No customer returns yet. Authorize a return in Sales & Orders → Returns.</p>}</div>
    {q.data && <Pagination offset={offset} total={q.data.total} setOffset={setOffset} />}
  </Page>;
}

export function ReturnWorkspace({ id, sales = false, quality: qualityMode = false }: { id: string; sales?: boolean; quality?: boolean }) {
  const inventory = useModuleAccess("inventory"), quality = useModuleAccess("quality"), salesAccess = useModuleAccess("sales");
  const base = sales ? "/sales/return-workflow" : qualityMode ? "/quality/returns" : "/inventory/returns";
  const q = useQuery({ queryKey: ["return", id, base], queryFn: () => apiGet<Return>(`${base}/${id}`) });
  const o = useQuery({ queryKey: ["inventory-operation-options"], queryFn: () => apiGet<Options>("/inventory/operations/options"), enabled: !sales && !qualityMode });
  const write = useWrite();
  const [action, setAction] = React.useState(qualityMode ? "assess" : "receive");
  const [reason, setReason] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [quantities, setQuantities] = React.useState<Record<number, { quantity?: string; approved?: string; repair?: string; scrap?: string }>>({});
  const r = q.data;
  const disposition = action === "assess" || action === "repair";
  const closed = r?.status === "Closed" || r?.status === "Cancelled" || r?.legacy;
  const update = (lineId: number, key: string, value: string) => setQuantities({ ...quantities, [lineId]: { ...quantities[lineId], [key]: value } });
  return <Page title={r?.reference ?? "Customer return"} intro="Receipt moves units into quarantine. QC approval moves them to ready for restock; warehouse put-away adds sellable stock. Repair stock must be reinspected. Scrapped units never enter available stock.">
    <Link className="text-sm underline" href={`/${sales ? "sales" : qualityMode ? "quality" : "inventory"}/returns`}>All returns</Link><ErrorText error={write.error || q.error} />
    {r && <><section className={card}><h2 className="font-semibold">{r.order} · {r.customer} · {r.status}</h2><p className="text-sm">{r.warehouse} · {r.reason}</p>
      <p className="text-sm text-muted-foreground">Requested refund: {r.currency} {r.refund}. No financial credit or payment is posted by this workflow.</p>
      {sales && inventory.canRead && <Link className="text-sm underline" href={`/inventory/returns/${id}`}>Open warehouse processing</Link>}
      {!qualityMode && quality.canRead && <Link className="block text-sm underline" href={`/quality/returns/${id}`}>Open return QC</Link>}
      {qualityMode && inventory.canRead && <Link className="text-sm underline" href={`/inventory/returns/${id}`}>Open warehouse put-away</Link>}
      {r.legacy && <p className="text-sm text-amber-700">Historical metadata record; no physical quantities were recorded. It cannot change inventory.</p>}</section>
      <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full"><thead><tr>{["Variant", "Authorized", "Received", "Quarantine", "Ready", "Repair", "Scrap", "Restocked"].map(t => <th className={cell} key={t}>{t}</th>)}</tr></thead><tbody>{r.lines.map(l => <tr key={l.id}>
        <td className={cell}>{l.label}</td><td className={cell}>{l.requested - l.cancelled}{l.cancelled > 0 && <p className="text-muted-foreground">{l.cancelled} cancelled</p>}</td>
        <td className={cell}>{l.received}</td><td className={cell}>{l.quarantine}</td><td className={cell}>{l.ready}</td><td className={cell}>{l.repair}</td><td className={cell}>{l.scrap}</td><td className={cell}>{l.restocked}</td></tr>)}</tbody></table></div>
      {!closed && !sales && <form className={card} onSubmit={async e => { e.preventDefault(); const lines = r.lines.map(l => ({ id: l.id,
        quantity: Number(quantities[l.id]?.quantity || 0), approved: Number(quantities[l.id]?.approved || 0), repair: Number(quantities[l.id]?.repair || 0), scrap: Number(quantities[l.id]?.scrap || 0) }))
        .filter(l => disposition ? l.approved + l.repair + l.scrap > 0 : l.quantity > 0);
        const result = await write.send<Return>(`${base}/${id}/${action}`, { reason, locationId: action === "receive" ? location || r.locationId : undefined, lines });
        if (result) { setQuantities({}); setReason(""); }
      }}><h2 className="font-semibold">Process returned goods</h2><label className="text-sm font-medium">Action<select className={field} value={action} onChange={e => { setAction(e.target.value); setQuantities({}); }}>
        {qualityMode ? <><option value="assess" disabled={!quality.canWrite}>QC disposition</option><option value="repair" disabled={!quality.canWrite}>Reinspect repaired goods</option></> :
          <><option value="receive" disabled={!inventory.canWrite}>Warehouse receipt</option><option value="restock" disabled={!inventory.canWrite}>Put away approved goods</option></>}</select></label>
        {action === "receive" && <Select title="Actual receiving warehouse" options={o.data?.locations ?? []} value={location || r.locationId || ""} onChange={setLocation} />}
        {r.lines.map(l => { const maximum = action === "receive" ? l.requested - l.cancelled - l.received : action === "assess" ? l.quarantine : action === "repair" ? l.repair : l.ready;
          if (maximum <= 0) return null;
          return <div key={l.id} className="rounded-lg border border-border p-3"><p className="mb-3 text-sm font-medium">{l.label} · {maximum} eligible</p><div className="grid gap-3 md:grid-cols-3">
            {(disposition ? action === "repair" ? ["approved", "scrap"] : ["approved", "repair", "scrap"] : ["quantity"]).map(key => <label key={key} className="text-sm">
              {key === "approved" ? "Approve for restock" : key === "repair" ? "Send to repair" : key === "scrap" ? "Scrap" : "Actual quantity"}
              <input className={field} type="number" min="0" max={maximum} step="1" value={quantities[l.id]?.[key as "quantity" | "approved" | "repair" | "scrap"] ?? ""} onChange={e => update(l.id, key, e.target.value)} /></label>)}</div></div>;
        })}<label className="block text-sm font-medium">Action reason<textarea className={field} required minLength={3} maxLength={400} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <button className={button} disabled={write.busy || (disposition ? !quality.canWrite : !inventory.canWrite)}>Record {action === "restock" ? "put-away" : action}</button></form>}
      {!closed && !qualityMode && salesAccess.canWrite && <section className={card}><label className="block text-sm font-medium">Reason for cancellation / closing<input className={field} minLength={3} maxLength={400} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <div className="flex flex-wrap gap-3"><button className={button} disabled={write.busy || reason.trim().length < 3 || r.lines.some(l => l.received > 0)} onClick={() => void write.send(`${base}/${id}/cancel`, { reason })}>Cancel unreceived return</button>
          <button className={button} disabled={write.busy || reason.trim().length < 3 || r.lines.some(l => l.received !== l.restocked + l.scrap)} onClick={() => void write.send(`${base}/${id}/close`, { reason })}>Close remaining authorization</button></div>
        <p className="text-xs text-muted-foreground">Closing releases only the quantities that never arrived. Process every received unit first.</p></section>}
      <History events={r.events} /></>}{q.isLoading && <p>Loading return…</p>}
  </Page>;
}
