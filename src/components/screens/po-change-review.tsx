"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useModuleAccess } from "@/lib/module-access";

type Change = { status: string; expected?: never } | { expected: string; status?: never };
interface Impact {
  po: string; status: string; expected: string; reviewToken: string;
  blockers: string[];
  issues: { module: string; reference: string; status: string; href: string; action: string; canResolve?: boolean; resolveKey?: string | null; resolveLabel?: string | null }[];
}

function Issues({ impact, onResolve, busy }: { impact: Impact; onResolve?: (key: string) => void; busy?: boolean }) {
  return <div className="space-y-3">
    {impact.blockers.map((message) => <p key={message} className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</p>)}
    {impact.issues.length === 0 && <p className="text-sm text-muted-foreground">No linked records currently require follow-up.</p>}
    {impact.issues.map((issue, i) => <div key={`${issue.module}-${issue.resolveKey || i}`} className="rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><b>{issue.module} · {issue.reference || "Linked record"}</b><span>{issue.status}</span></div>
      <p className="my-2 text-muted-foreground">{issue.action}</p>
      <div className="flex flex-wrap gap-4">
        {issue.canResolve && issue.resolveKey && onResolve && <button type="button" className="font-semibold underline disabled:opacity-50" disabled={busy} onClick={() => onResolve(issue.resolveKey!)}>{issue.resolveLabel || "Remove"}</button>}
        <Link href={issue.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open {issue.module} ↗</Link>
      </div>
    </div>)}
  </div>;
}

export function POChangeReview({ id, change, onClose, onSaved }: {
  id: string; change: Change; onClose: () => void; onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const access = useModuleAccess("procurement");
  const [reason, setReason] = React.useState("");
  const [ack, setAck] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const query = new URLSearchParams(change as unknown as Record<string, string>).toString();
  const impact = useQuery({ queryKey: ["po-impact", id, query], queryFn: () => apiGet<Impact>(`/procurement/pos/${id}/impact?${query}`), refetchOnWindowFocus: false });
  const refresh = async () => { setAck(false); setError(""); await impact.refetch(); };
  const clearIssue = async (key: string) => {
    if (reason.trim().length < 3) { setError("Enter a reason before removing a linked record."); return; }
    setBusy(true); setError("");
    try {
      await apiPost(`/procurement/pos/${id}/impact/resolve`, { key, reason: reason.trim() });
      setAck(false);
      await impact.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove that linked record.");
    } finally { setBusy(false); }
  };
  const save = async () => {
    if (!impact.data || !access.canWrite) return;
    setBusy(true); setError("");
    try {
      const payload = { ...change, reason, reviewToken: impact.data.reviewToken, acknowledged: ack };
      if (change.status) await apiPost(`/procurement/pos/${id}/status`, payload);
      else await apiPut(`/procurement/pos/${id}/expected`, payload);
      setSaved(true);
      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "po-impact" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save PO change.");
      setAck(false);
      await impact.refetch();
    } finally { setBusy(false); }
  };
  const close = () => { if (!busy) { if (saved) onSaved?.(); onClose(); } };
  return <Dialog.Root open onOpenChange={(open) => { if (!open) close(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(94vw,680px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
      <Dialog.Title className="text-lg font-bold">{saved ? "PO updated — manual follow-up" : "Review PO change"}</Dialog.Title>
      <Dialog.Description className="my-3 text-sm text-muted-foreground">{saved
        ? "The linked records below are retained. Use their own modules to resolve the outstanding work."
        : "Remove a linked record here when it has not progressed. Received stock, dispatched shipments, and paid bills stay in their own modules."}</Dialog.Description>
      <p className="mb-4 text-sm font-semibold">{impact.data?.po} · {change.status ? `${impact.data?.status ?? "Current status"} → ${change.status}` : `Expected delivery: ${impact.data?.expected ?? ""} → ${change.expected}`}</p>
      {!saved && <label className="mb-4 block text-sm font-semibold">Reason<textarea disabled={busy} value={reason} maxLength={400} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded border p-2 font-normal" placeholder="Required before removing a linked record or confirming the change" /></label>}
      {impact.isFetching && <p role="status" className="mb-3 text-sm">Loading current impact…</p>}
      {impact.isError && <p role="alert" className="mb-3 text-sm text-red-700">{impact.error.message}</p>}
      {impact.data && <Issues impact={impact.data} busy={busy} onResolve={saved ? undefined : clearIssue} />}
      {!saved && <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={ack} disabled={busy || impact.isFetching} onChange={(e) => setAck(e.target.checked)} />
        <span>I have reviewed the constraints and will resolve any remaining linked issues manually.</span></label>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {!saved && <Button variant="outline" disabled={busy || impact.isFetching} onClick={refresh}>Refresh impact</Button>}
        <Button variant="outline" disabled={busy} onClick={close}>{saved ? "Close" : "Back"}</Button>
        {!saved && <Button disabled={busy || !access.canWrite || !impact.data || impact.isFetching || impact.isError || !!impact.data.blockers.length || !ack || reason.trim().length < 3} onClick={save}>{busy ? "Saving…" : "Confirm PO change"}</Button>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

export function POChangePanel({ id, onSaved }: { id: string; onSaved?: () => void }) {
  const access = useModuleAccess("procurement");
  const [change, setChange] = React.useState<Change | null>(null);
  const [expected, setExpected] = React.useState<string | null>(null);
  const current = useQuery({ queryKey: ["po-dependencies", id], queryFn: () => apiGet<Impact>(`/procurement/pos/${id}/impact`) });
  const closed = ["Cancelled", "Rejected", "Inactive"].includes(current.data?.status ?? "");
  const date = expected ?? current.data?.expected ?? "";
  return <section className="mb-5 rounded-xl border bg-white p-5">
    <h2 className="font-bold">PO changes and linked commitments</h2>
    {current.isError && <p role="alert" className="mt-3 text-sm text-red-700">Could not load PO commitments. <button className="underline" onClick={() => current.refetch()}>Retry</button></p>}
    {current.data && <>
      {closed ? <div className="mt-3"><p className="mb-3 text-sm">This PO is {current.data.status}. Review any outstanding linked records below.</p><Issues impact={current.data} /></div> : <>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">Expected delivery<input type="date" aria-label="Expected delivery" value={/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ""} onChange={(e) => setExpected(e.target.value)} disabled={!access.canWrite} className="mt-1 block rounded border p-2" /></label>
          <Button variant="outline" disabled={!access.canWrite || !date.trim() || date.trim() === current.data.expected} onClick={() => setChange({ expected: date.trim() })}>Review delivery change</Button>
          <Button variant="outline" disabled={!access.canWrite} onClick={() => setChange({ status: "Cancelled" })}>Cancel PO</Button>
          <Button variant="outline" disabled={!access.canWrite} onClick={() => setChange({ status: "Inactive" })}>Make inactive</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Every change requires an impact review and reason. Commercial quantities, supplier and agreed prices remain the saved PO commitment; use a replacement PO for a commercial revision.</p>
      </>}
    </>}
    {change && <POChangeReview id={id} change={change} onClose={() => setChange(null)} onSaved={() => { setExpected(null); current.refetch(); onSaved?.(); }} />}
  </section>;
}
