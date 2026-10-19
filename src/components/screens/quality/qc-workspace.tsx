"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiDelete, apiGet, apiPost, apiPut, apiUpload } from "@/lib/api-client";

type Source = { id: number; color: string | null; size: string | null; sku: string | null; awaiting: number; held: number; approved: number; rejected: number; tnaComplete: boolean };
type Check = { publicId: string; criterion: string; requirement: string | null; actual: string | null; result: string; notes: string | null; targetValue: number | null; tolerance: number | null };
type Defect = { publicId: string; name: string | null; severity: string | null; qty: number; notes: string | null; imageDocId: string | null };
type Inspection = {
  publicId: string; inspectionNo: string | null; result: string; stage: string; samplingMode: string | null;
  sampleSize: number | null; lotQty: number | null; maxDefects: number | null; defectCount: number;
  purpose: string | null; accepted: boolean; reasons: string[]; checks: Check[]; defects: Defect[];
  reservations: { sourceId: number; qty: number; kind: string }[];
};
type Task = {
  taskKey: string; orderRef: string; poRef: string | null; poId: string | null; supplier: string | null;
  article: string; scope: string; awaiting: number; held: number; approved: number; rejected: number;
  status: string; legacy: boolean; legacyNote: string | null; suggestedSampleSize: number; suggestedMaxDefects: number;
  plan: string; sources: Source[]; reworkOpen: boolean; canReleaseException: boolean;
  inspection: Inspection | null; history: { inspectionNo: string | null; stage: string; result: string; legacy: boolean; approved: number | null; held: number | null; rejected: number | null; decision: string | null }[];
  links: { production: string; purchaseOrder: string | null; shipments: string; inventory: string };
};

const message = (error: unknown) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Could not save.";

export function QcWorkspace({ taskKey }: { taskKey: string }) {
  const client = useQueryClient();
  const task = useQuery({
    queryKey: ["quality", "task", taskKey],
    queryFn: () => apiGet<Task>(`/quality/tasks?task=${encodeURIComponent(taskKey)}`),
    enabled: !!taskKey,
  });
  const [error, setError] = useState<string | null>(null);
  const [startRequest, setStartRequest] = useState<string | null>(null);
  const [decideRequest, setDecideRequest] = useState<string | null>(null);
  const [resolveRequest, setResolveRequest] = useState<string | null>(null);
  const [stage, setStage] = useState<"Final" | "Inline">("Final");
  const [samplingMode, setSamplingMode] = useState<"sample" | "full">("sample");
  const [sampleSize, setSampleSize] = useState("");
  const [inspector, setInspector] = useState("");
  const [check, setCheck] = useState({ criterion: "", requirement: "", actual: "", notes: "" });
  const [defect, setDefect] = useState({ defectName: "", severity: "Major", qtyAffected: "1", description: "", imageDocId: "" });
  const [decision, setDecision] = useState<"approve_all" | "hold_all" | "split">("hold_all");
  const [exceptionReason, setExceptionReason] = useState("");
  const [split, setSplit] = useState<Record<number, { approved: string; held: string; rejected: string }>>({});
  const [resolveReason, setResolveReason] = useState("");
  const [holdPick, setHoldPick] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const reload = () => client.invalidateQueries({ queryKey: ["quality", "task", taskKey] });

  if (!taskKey) return <p className="p-6 text-sm">Choose an inspection from the quality queue.</p>;
  if (task.isLoading) return <p className="p-6 text-sm">Loading inspection…</p>;
  if (task.isError || !task.data) return <p role="alert" className="p-6 text-sm text-red-700">{message(task.error)}</p>;
  const data = task.data;
  const inspection = data.inspection;
  const needsReservation = !!inspection && inspection.stage === "Final" && inspection.reservations.length === 0;
  const heldLines = () => data.sources.filter((row) => row.held > 0).map((row) => ({
    sourceId: row.id,
    qty: Math.max(0, Number(holdPick[row.id] ?? row.held) || 0),
  }));
  const heldTable = (
    <table className="mt-3 w-full text-sm">
      <thead><tr><th className="text-left">Colour / size</th><th>Held</th><th>Selected</th></tr></thead>
      <tbody>
        {data.sources.filter((row) => row.held > 0).map((row) => (
          <tr key={row.id}>
            <td>{[row.color, row.size].filter(Boolean).join(" / ") || row.sku || data.article}</td>
            <td className="text-center">{row.held}</td>
            <td><input className="w-20 rounded-md border px-2 py-1" value={holdPick[row.id] ?? String(row.held)} onChange={(e) => setHoldPick({ ...holdPick, [row.id]: e.target.value })} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const begin = async (nextPurpose: "awaiting" | "held") => {
    if (busy) return;
    const requestId = startRequest ?? crypto.randomUUID();
    const covered = nextPurpose === "held" ? heldLines().reduce((sum, row) => sum + row.qty, 0) : data.awaiting;
    const asked = samplingMode === "full" ? covered : Number(sampleSize || data.suggestedSampleSize || covered);
    setStartRequest(requestId); setBusy(true); setError(null);
    try {
      await apiPost("/quality/tasks/start", {
        taskKey: data.taskKey, requestId,
        stage: nextPurpose === "held" ? "Final" : stage,
        purpose: nextPurpose, samplingMode,
        sampleSize: Math.min(Math.max(asked, 1), Math.max(covered, 1)),
        inspector, aql: "2.5",
        lines: nextPurpose === "held" ? heldLines() : undefined,
      });
      setStartRequest(null); reload();
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };

  const saveCheck = async (row: Check, patch: Partial<Check>) => {
    setError(null);
    try {
      await apiPut(`/quality/checks/${row.publicId}`, {
        criterion: row.criterion, requirement: row.requirement, actual: patch.actual ?? row.actual,
        result: patch.result ?? row.result, notes: patch.notes ?? row.notes,
        targetValue: row.targetValue, tolerance: row.tolerance,
      });
      reload();
    } catch (error) { setError(message(error)); }
  };

  const addCheck = async () => {
    setError(null);
    try {
      await apiPost(`/quality/inspections/${inspection?.publicId}/checks`, { ...check, result: "Pending" });
      setCheck({ criterion: "", requirement: "", actual: "", notes: "" });
      reload();
    } catch (error) { setError(message(error)); }
  };

  const addDefect = async () => {
    setError(null);
    try {
      await apiPost(`/quality/inspections/${inspection?.publicId}/defects`, {
        defectName: defect.defectName, qtyAffected: Number(defect.qtyAffected) || 1,
        description: defect.description, imageDocId: defect.imageDocId || null,
        newDefect: defect.defectName ? { name: defect.defectName, category: "Workmanship", severity: defect.severity } : null,
      });
      setDefect({ defectName: "", severity: "Major", qtyAffected: "1", description: "", imageDocId: "" });
      reload();
    } catch (error) { setError(message(error)); }
  };

  const decide = async () => {
    const requestId = decideRequest ?? crypto.randomUUID();
    setDecideRequest(requestId); setError(null);
    const allocations = (inspection?.reservations ?? []).map((row) => ({
      sourceId: row.sourceId,
      approved: Number(split[row.sourceId]?.approved ?? 0),
      held: Number(split[row.sourceId]?.held ?? row.qty),
      rejected: Number(split[row.sourceId]?.rejected ?? 0),
    }));
    try {
      await apiPost("/quality/tasks/decide", {
        taskKey: data.taskKey, requestId,
        decision: inspection?.stage === "In-line" ? "inline" : decision,
        exceptionReason, allocations,
      });
      setDecideRequest(null); reload();
    } catch (error) { setError(message(error)); }
  };

  const resolve = async (action: "rework" | "reject") => {
    if (busy) return;
    const requestId = resolveRequest ?? crypto.randomUUID();
    setResolveRequest(requestId); setBusy(true); setError(null);
    try {
      await apiPost("/quality/tasks/resolve", {
        taskKey: data.taskKey, requestId, action, reason: resolveReason,
        lines: action === "reject" ? heldLines() : [],
      });
      setResolveRequest(null);
      reload();
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <Link href="/quality/inspections" className="text-sm font-semibold text-primary underline">Back to quality queue</Link>
      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      <header className="rounded-xl border bg-white p-5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Inspection</p>
        <h1 className="text-xl font-bold">{data.article}</h1>
        <p className="text-sm text-muted-foreground">{data.orderRef} · PO {data.poRef || "—"} · {data.supplier || "No supplier"} · {data.scope}</p>
        <p className="mt-2 text-sm">Status <strong>{data.status}</strong></p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-md bg-muted/40 px-3 py-2"><dt className="text-muted-foreground">Awaiting QC</dt><dd className="text-lg font-semibold">{data.awaiting}</dd></div>
          <div className="rounded-md bg-muted/40 px-3 py-2"><dt className="text-muted-foreground">Approved</dt><dd className="text-lg font-semibold">{data.approved}</dd></div>
          <div className="rounded-md bg-muted/40 px-3 py-2"><dt className="text-muted-foreground">On hold</dt><dd className="text-lg font-semibold">{data.held}</dd></div>
          <div className="rounded-md bg-muted/40 px-3 py-2"><dt className="text-muted-foreground">Rejected</dt><dd className="text-lg font-semibold">{data.rejected}</dd></div>
        </dl>
        {data.legacyNote && <p className="mt-2 text-sm text-amber-800">{data.legacyNote}</p>}
        {data.reworkOpen && <p className="mt-2 text-sm text-amber-800">Production rework is open. Final reinspection stays blocked until that article's TNA is complete.</p>}
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link className="underline" href={data.links.production}>Production</Link>
          {data.links.purchaseOrder && <Link className="underline" href={data.links.purchaseOrder}>Purchase order</Link>}
          <Link className="underline" href={data.links.shipments}>Shipments</Link>
          <Link className="underline" href={data.links.inventory}>Inventory</Link>
        </div>
      </header>

      {(!inspection || needsReservation) && (data.awaiting > 0 || needsReservation) && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Inspect finished pieces</h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.awaiting} pieces are waiting. The sample size is how many you look at. The release decision covers all {data.awaiting}.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Stage<select className="mt-1 w-full rounded-md border px-2 py-1" value={stage} onChange={(e) => setStage(e.target.value as "Final" | "Inline")}><option value="Final">Final</option><option value="Inline">Inline — does not release pieces</option></select></label>
            <label className="text-sm">Coverage<select className="mt-1 w-full rounded-md border px-2 py-1" value={samplingMode} onChange={(e) => setSamplingMode(e.target.value as "sample" | "full")}><option value="sample">Sampling</option><option value="full">100% inspection</option></select></label>
            <label className="text-sm">Sample size<input className="mt-1 w-full rounded-md border px-2 py-1" value={samplingMode === "full" ? String(data.awaiting) : sampleSize} placeholder={String(data.suggestedSampleSize || "")} disabled={samplingMode === "full"} onChange={(e) => setSampleSize(e.target.value)} /></label>
            <label className="text-sm">Inspector<input className="mt-1 w-full rounded-md border px-2 py-1" value={inspector} onChange={(e) => setInspector(e.target.value)} /></label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Suggested sample {data.suggestedSampleSize || "—"} for this lot. Acceptance number {data.suggestedMaxDefects}. {data.plan}</p>
          {needsReservation && <p className="mt-2 text-sm text-amber-800">This inspection is open but has not reserved a quantity. Start it to lock the pieces this decision covers.</p>}
          <button type="button" className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => begin("awaiting")}>Start inspection</button>
        </section>
      )}

      {inspection && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">2. Record checks · {inspection.inspectionNo}</h2>
          <p className="text-sm text-muted-foreground">{inspection.stage} · sample {inspection.sampleSize ?? "—"} · lot covered {inspection.lotQty ?? "not a release"} · defects {inspection.defectCount} / limit {inspection.maxDefects ?? "—"}</p>
          <div className="mt-3 space-y-2">
            {inspection.checks.map((row) => (
              <div key={row.publicId} className="grid gap-2 rounded-md border p-2 sm:grid-cols-[1fr_120px_1fr_auto]">
                <div><strong>{row.criterion}</strong><p className="text-xs text-muted-foreground">{row.requirement}</p></div>
                <input className="rounded-md border px-2 py-1 text-sm" defaultValue={row.actual ?? ""} placeholder="Actual" onBlur={(e) => saveCheck(row, { actual: e.target.value })} />
                <input className="rounded-md border px-2 py-1 text-sm" defaultValue={row.notes ?? ""} placeholder="Notes" onBlur={(e) => saveCheck(row, { notes: e.target.value })} />
                <select className="rounded-md border px-2 py-1 text-sm" value={row.result} onChange={(e) => saveCheck(row, { result: e.target.value })}>
                  {["Pending", "Pass", "Fail", "Warning", "NA"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <input className="rounded-md border px-2 py-1 text-sm" placeholder="Check" value={check.criterion} onChange={(e) => setCheck({ ...check, criterion: e.target.value })} />
            <input className="rounded-md border px-2 py-1 text-sm" placeholder="Requirement" value={check.requirement} onChange={(e) => setCheck({ ...check, requirement: e.target.value })} />
            <input className="rounded-md border px-2 py-1 text-sm" placeholder="Actual" value={check.actual} onChange={(e) => setCheck({ ...check, actual: e.target.value })} />
            <button type="button" className="rounded-md border px-3 py-1 text-sm font-semibold" onClick={addCheck}>Add check</button>
          </div>
          <h3 className="mt-4 font-semibold">Defects</h3>
          {inspection.defects.map((row) => <p key={row.publicId} className="text-sm">{row.name} · {row.severity} · {row.qty}{row.notes ? ` · ${row.notes}` : ""} <button type="button" className="underline" onClick={() => apiDelete(`/quality/defects/log/${row.publicId}`).then(reload).catch((error) => setError(message(error)))}>Remove</button></p>)}
          <div className="mt-2 grid gap-2 sm:grid-cols-5">
            <input className="rounded-md border px-2 py-1 text-sm" placeholder="Defect" value={defect.defectName} onChange={(e) => setDefect({ ...defect, defectName: e.target.value })} />
            <select className="rounded-md border px-2 py-1 text-sm" value={defect.severity} onChange={(e) => setDefect({ ...defect, severity: e.target.value })}><option>Critical</option><option>Major</option><option>Minor</option></select>
            <input className="rounded-md border px-2 py-1 text-sm" placeholder="Qty" value={defect.qtyAffected} onChange={(e) => setDefect({ ...defect, qtyAffected: e.target.value })} />
            <input className="rounded-md border px-2 py-1 text-sm" placeholder="Notes" value={defect.description} onChange={(e) => setDefect({ ...defect, description: e.target.value })} />
            <label className="text-sm">{defect.imageDocId ? "Photo attached" : "Photo"}<input type="file" accept="image/*" className="block text-xs" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              try {
                const form = new FormData(); form.append("module", "quality"); form.append("entity_type", "inspection:defect"); form.append("file", file);
                const uploaded = await apiUpload<{ public_id: string }>("/documents/upload", form);
                setDefect((current) => ({ ...current, imageDocId: uploaded.public_id }));
              } catch (error) { setError(message(error)); }
            }} /></label>
          </div>
          <button type="button" className="mt-2 rounded-md border px-3 py-1 text-sm font-semibold" onClick={addDefect}>Add defect</button>
        </section>
      )}

      {inspection && !needsReservation && (
        <section className="sticky bottom-4 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">3. Complete and confirm decision</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">{inspection.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          {inspection.stage === "Final" ? (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(["approve_all", "hold_all", "split"] as const).map((item) => (
                  <button key={item} type="button" className={`rounded-md border px-3 py-1 text-sm font-semibold ${decision === item ? "bg-primary text-white" : ""}`} onClick={() => setDecision(item)}>
                    {item === "approve_all" ? "Approve all" : item === "hold_all" ? "Hold all" : "Split quantities"}
                  </button>
                ))}
              </div>
              {!inspection.accepted && decision !== "hold_all" && (
                <label className="block text-sm">Exception reason {data.canReleaseException ? "" : "(administrator required)"}
                  <input className="mt-1 w-full rounded-md border px-2 py-1" value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} />
                </label>
              )}
              {decision === "split" && (
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left">Colour / size</th><th>Reserved</th><th>Approved</th><th>Held</th><th>Rejected</th></tr></thead>
                  <tbody>
                    {inspection.reservations.map((row) => {
                      const source = data.sources.find((item) => item.id === row.sourceId);
                      const current = split[row.sourceId] || { approved: "0", held: String(row.qty), rejected: "0" };
                      return (
                        <tr key={row.sourceId}>
                          <td>{[source?.color, source?.size].filter(Boolean).join(" / ") || source?.sku || row.sourceId}</td>
                          <td className="text-center">{row.qty}</td>
                          {(["approved", "held", "rejected"] as const).map((field) => (
                            <td key={field}><input className="w-20 rounded-md border px-2 py-1" value={current[field]} onChange={(e) => setSplit({ ...split, [row.sourceId]: { ...current, [field]: e.target.value } })} /></td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : <p className="mt-2 text-sm">Inline completion records the result only. It does not approve, hold, or reject pieces.</p>}
          <button type="button" className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={decide}>Complete inspection</button>
        </section>
      )}

      {!inspection && data.held > 0 && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Pieces on hold</h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.held} pieces are on hold. The {data.approved} approved pieces stay approved. Choose one action for the selected hold quantity.</p>
          {heldTable}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Coverage<select className="mt-1 w-full rounded-md border px-2 py-1" value={samplingMode} onChange={(e) => setSamplingMode(e.target.value as "sample" | "full")}><option value="sample">Sampling</option><option value="full">100% inspection</option></select></label>
            <label className="text-sm">Sample size<input className="mt-1 w-full rounded-md border px-2 py-1" value={samplingMode === "full" ? String(data.held) : sampleSize} placeholder={String(data.suggestedSampleSize || "")} disabled={samplingMode === "full"} onChange={(e) => setSampleSize(e.target.value)} /></label>
            <label className="text-sm">Inspector<input className="mt-1 w-full rounded-md border px-2 py-1" value={inspector} onChange={(e) => setInspector(e.target.value)} /></label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Suggested sample {data.suggestedSampleSize || "—"} of the held pieces. Reinspect opens the checklist. It does not approve them yet.</p>
          <button type="button" className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => begin("held")}>Reinspect selected pieces</button>
          <label className="mt-4 block text-sm">Reason, required for rework or rejection
            <input className="mt-1 w-full rounded-md border px-2 py-1" value={resolveReason} onChange={(e) => setResolveReason(e.target.value)} />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-md border px-3 py-1 text-sm disabled:opacity-50" disabled={busy} onClick={() => resolve("rework")}>Send for production rework</button>
            <button type="button" className="rounded-md border px-3 py-1 text-sm disabled:opacity-50" disabled={busy} onClick={() => resolve("reject")}>Reject selected pieces</button>
          </div>
        </section>
      )}

      <details className="rounded-xl border bg-white p-5">
        <summary className="cursor-pointer font-semibold">Sampling, colour and size, history</summary>
        <p className="mt-2 text-sm">{data.plan}</p>
        <table className="mt-3 w-full text-sm">
          <thead><tr><th className="text-left">Colour / size</th><th>Awaiting</th><th>Held</th><th>Approved</th><th>Rejected</th></tr></thead>
          <tbody>{data.sources.map((row) => <tr key={row.id}><td>{[row.color, row.size].filter(Boolean).join(" / ") || row.sku || data.article}</td><td className="text-center">{row.awaiting}</td><td className="text-center">{row.held}</td><td className="text-center">{row.approved}</td><td className="text-center">{row.rejected}</td></tr>)}</tbody>
        </table>
        <div className="mt-3 space-y-1 text-sm">{data.history.map((row) => <p key={`${row.inspectionNo}-${row.result}`}>{row.inspectionNo} · {row.stage} · {row.result}{row.legacy ? " · legacy, quantities not recorded" : ""}{row.decision ? ` · ${row.decision}` : ""} · approved {row.approved ?? "—"} held {row.held ?? "—"} rejected {row.rejected ?? "—"}</p>)}</div>
      </details>
    </div>
  );
}
