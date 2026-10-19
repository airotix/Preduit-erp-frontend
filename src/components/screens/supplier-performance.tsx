"use client";

import * as React from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";

type Metric = { supplierId: string; name: string; status: string; completed: number; measuredDeliveries: number; onTime: number;
  onTimePct: number | null; firstPassPct: number | null; returnRate: number | null; overdue: number;
  qualityLots: number; passedFirstTime: number; returnedUnits: number; receivedUnits: number; replacementUnits: number;
  openReturns: number; missingDueDates: number; unmappedReceiptUnits: number; unmeasuredCompleted: number };
type Issue = { supplierId: string; supplier: string; sourceType: string; sourceId: string; reference: string; href: string; message: string; due: string | null };
type Followup = { id: string; supplierId: string; supplier: string; sourceType: string | null; sourceId: string | null;
  summary: string; owner: string; due: string; status: string; overdue: boolean; resolution: string | null;
  revision: string;
  events: { action: string; actor: string; at: string; data: { reason?: string; summary?: string } }[] };
type Report = { suppliers: Metric[]; attention: Issue[]; followups: Followup[]; owners: { email: string; name: string }[] };
const field = "mt-1 w-full rounded-md border bg-white p-2 text-sm";
const percent = (value: number | null) => value === null ? "—" : `${value}%`;
const sourceHref = (f: Followup) => f.sourceType === "po" ? `/procurement/pos/${f.sourceId}` : f.sourceType === "inspection" ? `/quality/inspections/${f.sourceId}` : "/procurement/returns";

export function SupplierPerformance({ initialSupplierId = "" }: { initialSupplierId?: string }) {
  const access = useModuleAccess("procurement");
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = React.useState(initialSupplierId);
  const [view, setView] = React.useState("active");
  const [dialog, setDialog] = React.useState<{ issue?: Issue; edit?: Followup } | null>(null);
  const [form, setForm] = React.useState({ supplierId: "", summary: "", owner: "", due: "", status: "Open", reason: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const request = React.useRef<{ key: string; id: string } | null>(null);
  const report = useQuery({ queryKey: ["supplier-performance"], queryFn: () => apiGet<Report>("/procurement/supplier-performance"), enabled: access.canRead });
  React.useEffect(() => setSupplierId(initialSupplierId), [initialSupplierId]);
  const selected = (id: string) => !supplierId || supplierId === id;
  const metrics = report.data?.suppliers.filter((s) => selected(s.supplierId)) ?? [];
  const issues = report.data?.attention.filter((s) => selected(s.supplierId)) ?? [];
  const followups = report.data?.followups.filter((f) => selected(f.supplierId) && (view === "all" || (view === "resolved" ? f.status === "Resolved" : f.status !== "Resolved"))) ?? [];
  const activeFor = (issue: Issue) => report.data?.followups.find((f) => f.sourceType === issue.sourceType && f.sourceId === issue.sourceId && f.status !== "Resolved");
  const open = (issue?: Issue, edit?: Followup) => {
    setError(""); setDialog({ issue, edit });
    setForm({ supplierId: edit?.supplierId ?? issue?.supplierId ?? supplierId,
      summary: edit?.summary ?? (issue ? `${issue.reference}: ${issue.message}`.slice(0, 240) : ""),
      owner: edit?.owner ?? "", due: edit?.due ?? "", status: edit?.status ?? "Open", reason: "" });
  };
  const save = async () => {
    if (!dialog || !access.canWrite) return;
    setBusy(true); setError("");
    try {
      const payload = dialog.edit ? { owner: form.owner, due: form.due, status: form.status, reason: form.reason, revision: dialog.edit.revision } : {
        supplierId: form.supplierId, summary: form.summary, owner: form.owner, due: form.due,
        sourceType: dialog.issue?.sourceType ?? null, sourceId: dialog.issue?.sourceId ?? null,
      };
      const path = `/procurement/supplier-followups${dialog.edit ? `/${dialog.edit.id}` : ""}`;
      const key = JSON.stringify({ path, payload });
      if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
      if (dialog.edit) await apiPut(path, { ...payload, requestId: request.current.id });
      else await apiPost(path, { ...payload, requestId: request.current.id });
      request.current = null; setDialog(null); await qc.invalidateQueries();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save supplier follow-up."); await report.refetch(); }
    finally { setBusy(false); }
  };
  if (!access.canRead) return <p className="p-6">Procurement read access is required.</p>;
  return <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Supplier performance and follow-ups</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Measured from recorded PO receipts, final inspections and supplier returns. Rates cover recorded history; missing evidence is shown as unavailable. Supplier status is maintained separately.</p></div>
      <Button disabled={!access.canWrite || !report.data} onClick={() => open()}>New follow-up</Button></div>
    <div className="flex flex-wrap items-center gap-3 text-sm"><label>Supplier <select className="ml-2 rounded border p-2" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">All suppliers</option>{report.data?.suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}</select></label><Button variant="outline" onClick={() => report.refetch()}>Refresh</Button><Link className="underline" href="/procurement/suppliers">Supplier directory</Link></div>
    {report.isPending && <p>Loading supplier evidence…</p>}
    {report.isError && <p role="alert" className="text-sm text-red-700">{report.error.message}</p>}
    <section className="rounded-xl border bg-white p-4"><h2 className="mb-3 font-bold">Measured performance</h2>
      <Table className="w-full text-left text-sm"><thead><tr><th className="p-2">Supplier</th><th className="p-2">On-time delivery</th><th className="p-2">Final QC first pass</th><th className="p-2">Returned units</th><th className="p-2">Overdue POs</th><th className="p-2">Open returns</th></tr></thead>
        <tbody>{metrics.map((m) => <tr key={m.supplierId} className="border-t align-top"><td className="p-2"><Link className="font-semibold underline" href={`/procurement/suppliers/${m.supplierId}`}>{m.name}</Link><div className="text-xs text-muted-foreground">{m.status}</div></td>
          <td className="p-2 font-semibold">{percent(m.onTimePct)}<div className="text-xs font-normal text-muted-foreground">{m.onTime}/{m.measuredDeliveries} dated completed POs</div></td>
          <td className="p-2 font-semibold">{percent(m.firstPassPct)}<div className="text-xs font-normal text-muted-foreground">{m.passedFirstTime}/{m.qualityLots} first final assessments</div></td>
          <td className="p-2 font-semibold">{percent(m.returnRate)}<div className="text-xs font-normal text-muted-foreground">{m.returnedUnits}/{m.receivedUnits + m.replacementUnits} received units</div></td>
          <td className="p-2">{m.overdue}</td><td className="p-2">{m.openReturns}</td></tr>)}</tbody></Table>
      {report.data && !metrics.length && <p className="mt-3 text-sm">No matching supplier.</p>}
      <details className="mt-4 rounded border p-3 text-sm"><summary>How these rates are calculated and where evidence is missing</summary>
        <p className="mt-2">On-time means all ordered size/colour quantities were received by the original due date. Only completed POs with a complete date trail enter that rate; overdue open POs are shown separately. Delivery revisions change the operational queue and preserve the captured original date.</p>
        <p className="mt-2">QC first pass counts the first finalized inspection for each production style or batch variant. It is an inspection pass rate, not a defective-unit rate. Return rate includes all recorded return reasons and replacement receipts; it does not assign supplier fault automatically.</p>
        {metrics.map((m) => <p className="mt-2" key={m.supplierId}><b>{m.name}:</b> {m.unmeasuredCompleted} completed PO(s) excluded for missing original due dates or receipt dates; {m.missingDueDates} approved/received PO(s) lack a captured original date; {m.unmappedReceiptUnits} receipt unit(s) lack an unambiguous PO line.</p>)}
        <p className="mt-2 text-muted-foreground">Original dates are captured for new POs. A legacy PO's current expected date cannot prove its original promise, so those POs are excluded from the on-time rate. Day/month labels are not assigned a year. Price comparisons and an overall weighted score are not inferred.</p>
      </details>
    </section>
    <section className="space-y-3 rounded-xl border bg-white p-5"><h2 className="font-bold">Needs attention · {issues.length}</h2>
      {!issues.length && <p className="text-sm text-muted-foreground">No current issues detected from the available records.</p>}
      {issues.map((issue) => { const active = activeFor(issue); return <div className="flex flex-wrap items-start justify-between gap-3 rounded border p-3 text-sm" key={`${issue.sourceType}-${issue.sourceId}`}><div><Link className="font-semibold underline" href={issue.href}>{issue.reference}</Link> · {issue.supplier}<p className="mt-1">{issue.message}</p>{active && <p className="mt-1 text-xs text-muted-foreground">Assigned to {active.owner} · due {active.due}</p>}</div><Button variant="outline" disabled={!access.canWrite} onClick={() => active ? open(undefined, active) : open(issue)}>{active ? "Update follow-up" : "Assign follow-up"}</Button></div>; })}
    </section>
    <section className="space-y-3 rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold">Follow-up register · {followups.length}</h2><select aria-label="Follow-up status filter" className="rounded border p-2 text-sm" value={view} onChange={(e) => setView(e.target.value)}><option value="active">Active</option><option value="resolved">Resolved</option><option value="all">All</option></select></div>
      {followups.map((f) => <article className="space-y-2 rounded border p-3 text-sm" key={f.id}><div className="flex flex-wrap justify-between gap-2"><b>{f.summary}</b><span className={f.overdue ? "font-semibold text-red-700" : ""}>{f.status}{f.overdue ? " · Overdue" : ""}</span></div><p>{f.supplier} · {f.owner} · due {f.due}</p>
        {f.sourceId && <Link className="inline-block underline" href={sourceHref(f)}>Open source record</Link>}
        {f.sourceId && f.status !== "Resolved" && !report.data?.attention.some((a) => a.sourceType === f.sourceType && a.sourceId === f.sourceId) && <p className="text-muted-foreground">The source no longer appears in the current issue queue. Confirm the outcome and resolve this follow-up manually.</p>}
        {f.resolution && <p>Resolution: {f.resolution}</p>}
        {f.status !== "Resolved" && <Button variant="outline" disabled={!access.canWrite} onClick={() => open(undefined, f)}>Update / resolve</Button>}
        <details><summary>History</summary><div className="mt-2 space-y-2">{f.events.map((e, i) => <p key={i}>{e.action} · {e.actor} · {new Date(e.at).toLocaleString()}<br />{e.data.reason || e.data.summary}</p>)}</div></details>
      </article>)}
      {!followups.length && <p className="text-sm text-muted-foreground">No follow-ups in this view.</p>}
      <p className="text-xs text-muted-foreground">Resolving a follow-up records the supplier discussion and outcome. Source PO, QC and return issues stay visible until their own module records are corrected. No messages are sent to suppliers.</p>
    </section>
    <Dialog.Root open={!!dialog} onOpenChange={(open) => { if (!open && !busy) setDialog(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
      <Dialog.Title className="text-lg font-bold">{dialog?.edit ? "Update supplier follow-up" : "Assign supplier follow-up"}</Dialog.Title><Dialog.Description className="my-3 text-sm text-muted-foreground">Assign an internal Procurement owner and due date. Record the supplier's response and corrective action in the resolution note.</Dialog.Description>
      <fieldset disabled={busy} className="space-y-3 text-sm">
        {!dialog?.edit && <><label className="block">Supplier<select disabled={!!dialog?.issue} className={field} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}><option value="">Choose supplier</option>{report.data?.suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}</select></label><label className="block">Summary<input className={field} maxLength={240} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label></>}
        <label className="block">Internal owner<select className={field} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}><option value="">Choose Procurement owner</option>{report.data?.owners.map((owner) => <option key={owner.email} value={owner.email}>{owner.name} · {owner.email}</option>)}</select></label>
        <label className="block">Due date<input className={field} type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></label>
        {dialog?.edit && <><label className="block">Status<select className={field} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Open</option><option>In progress</option><option>Resolved</option></select></label><label className="block">{form.status === "Resolved" ? "Resolution / supplier response" : "Update note"}<textarea className={field} maxLength={1000} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label></>}
      </fieldset>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>Back</Button><Button disabled={busy || !form.owner || !form.due || (dialog?.edit ? form.reason.trim().length < 3 : !form.supplierId || form.summary.trim().length < 3)} onClick={save}>{busy ? "Saving…" : "Save follow-up"}</Button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
