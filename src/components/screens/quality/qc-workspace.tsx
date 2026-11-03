"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiDelete, apiGet, apiPost, apiPut, apiUpload } from "@/lib/api-client";
import { statusTone } from "@/lib/tone";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { LoadingBlock, Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/tone-badge";

type Source = { id: number; color: string | null; size: string | null; sku: string | null; awaiting: number; held: number; approved: number; rejected: number; tnaComplete: boolean };
type Check = { publicId: string; criterion: string; requirement: string | null; actual: string | null; result: string; notes: string | null; targetValue: number | null; tolerance: number | null };
type Defect = { publicId: string; name: string | null; severity: string | null; qty: number; notes: string | null; imageDocId: string | null };
type DefectOption = { publicId: string; name: string; category: string | null; severity: string | null };
type Inspection = {
  publicId: string; inspectionNo: string | null; result: string; stage: string; samplingMode: string | null;
  sampleSize: number | null; lotQty: number | null; maxDefects: number | null; defectCount: number;
  purpose: string | null; accepted: boolean; reasons: string[]; checks: Check[]; defects: Defect[];
  reservations: { sourceId: number; qty: number; kind: string }[];
};
type Task = {
  taskKey: string; orderRef: string; poRef: string | null; poId: string | null; supplier: string | null;
  article: string; scope: string; awaiting: number; held: number; approved: number; rejected: number;
  status: string; legacy: boolean; legacyNote: string | null; aql: string; suggestedSampleSize: number; suggestedMaxDefects: number;
  plan: string; sources: Source[]; reworkOpen: boolean; canReleaseException: boolean;
  inspection: Inspection | null; history: { inspectionNo: string | null; stage: string; result: string; legacy: boolean; approved: number | null; held: number | null; rejected: number | null; decision: string | null }[];
  links: { production: string; purchaseOrder: string | null; shipments: string; inventory: string };
};
type Split = { approved: string; held: string; rejected: string };

const NEW_DEFECT = "__new__";
const message = (error: unknown) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Could not save.";
const whole = (value: string) => { const n = Number(value); return value.trim() !== "" && Number.isInteger(n) && n >= 0 ? n : NaN; };
const optionalNumber = (value: string) => value.trim() === "" ? null : Number(value);
const colourSize = (row: { color?: string | null; size?: string | null; sku?: string | null } | undefined, fallback: string) =>
  [row?.color, row?.size].filter(Boolean).join(" / ") || row?.sku || fallback;

export function QcWorkspace({ taskKey }: { taskKey: string }) {
  const client = useQueryClient();
  const task = useQuery({
    queryKey: ["quality", "task", taskKey],
    queryFn: () => apiGet<Task>(`/quality/tasks?task=${encodeURIComponent(taskKey)}`),
    enabled: !!taskKey,
  });
  const defectOptions = useQuery({
    queryKey: ["quality", "defect-options"],
    queryFn: () => apiGet<{ options: DefectOption[] }>("/quality/defect-options"),
    enabled: !!taskKey,
  });
  const [error, setError] = useState<string | null>(null);
  const [startRequest, setStartRequest] = useState<string | null>(null);
  const [decideRequest, setDecideRequest] = useState<string | null>(null);
  const [resolveRequest, setResolveRequest] = useState<string | null>(null);
  const [samplingMode, setSamplingMode] = useState<"sample" | "full">("sample");
  const [sampleSize, setSampleSize] = useState("");
  const [inspector, setInspector] = useState("");
  const [check, setCheck] = useState({ criterion: "", requirement: "", target: "", tolerance: "", actual: "" });
  const [defect, setDefect] = useState({ typeId: "", defectName: "", severity: "Major", qtyAffected: "1", description: "", imageDocId: "" });
  const [exceptionReason, setExceptionReason] = useState("");
  const [split, setSplit] = useState<Record<number, Split>>({});
  const [resolveReason, setResolveReason] = useState("");
  const [holdPick, setHoldPick] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const reload = () => client.invalidateQueries({ queryKey: ["quality", "task", taskKey] });

  if (!taskKey) return <p className="p-6 text-sm">Choose an inspection from the quality queue.</p>;
  if (task.isLoading) return <div className="p-6"><LoadingBlock rows={4} /></div>;
  if (task.isError || !task.data) return <div className="p-6"><Notice tone="red">{message(task.error)}</Notice></div>;
  const data = task.data;
  const inspection = data.inspection;
  const needsReservation = !!inspection && inspection.stage === "Final" && inspection.reservations.length === 0;
  const sourceFor = (id: number) => data.sources.find((item) => item.id === id);

  // Decision table: every colour and size gets its own approved / held / rejected quantity.
  const reserved = inspection?.reservations ?? [];
  const suggested = (qty: number): Split => inspection?.accepted
    ? { approved: String(qty), held: "0", rejected: "0" }
    : { approved: "0", held: String(qty), rejected: "0" };
  const cell = (row: { sourceId: number; qty: number }): Split => split[row.sourceId] ?? suggested(row.qty);
  const rowIssue = (row: { sourceId: number; qty: number }) => {
    const c = cell(row);
    const parts = [whole(c.approved), whole(c.held), whole(c.rejected)];
    if (parts.some(Number.isNaN)) return "Use whole numbers";
    return parts[0] + parts[1] + parts[2] === row.qty ? null : `Must add up to ${row.qty}`;
  };
  const sum = (field: keyof Split) => reserved.reduce((total, row) => total + (whole(cell(row)[field]) || 0), 0);
  const totals = { qty: reserved.reduce((total, row) => total + row.qty, 0), approved: sum("approved"), held: sum("held"), rejected: sum("rejected") };
  const fillAll = (field: keyof Split) => setSplit(Object.fromEntries(reserved.map((row) => [row.sourceId, {
    approved: field === "approved" ? String(row.qty) : "0",
    held: field === "held" ? String(row.qty) : "0",
    rejected: field === "rejected" ? String(row.qty) : "0",
  }])));
  const needsException = totals.approved > 0 && !!inspection && !inspection.accepted;
  const decisionBlocked = reserved.some((row) => rowIssue(row))
    || (needsException && (!data.canReleaseException || !exceptionReason.trim()));

  const heldLines = () => data.sources.filter((row) => row.held > 0).map((row) => ({
    sourceId: row.id,
    qty: Math.max(0, Number(holdPick[row.id] ?? row.held) || 0),
  }));
  const heldTable = (
    <Table className="mt-3">
      <TableHeader><TableRow><TableHead className="px-0">Colour / size</TableHead><TableHead className="text-center">On hold</TableHead><TableHead>Selected</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.sources.filter((row) => row.held > 0).map((row) => (
          <TableRow key={row.id}>
            <TableCell className="px-0">{colourSize(row, data.article)}</TableCell>
            <TableCell className="text-center tabular-nums">{row.held}</TableCell>
            <TableCell><Input className="w-20" value={holdPick[row.id] ?? String(row.held)} onChange={(e) => setHoldPick({ ...holdPick, [row.id]: e.target.value })} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  const advanced = (covered: number) => (
    <details className="mt-3 rounded-lg border border-border/70 px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold">Advanced options</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold">Coverage<NativeSelect className="mt-1 font-normal" value={samplingMode} onChange={(e) => setSamplingMode(e.target.value as "sample" | "full")}><option value="sample">Sampling</option><option value="full">100% inspection</option></NativeSelect></label>
        <label className="text-sm font-semibold">Sample size<Input className="mt-1 font-normal" value={samplingMode === "full" ? String(covered) : sampleSize} placeholder={String(data.suggestedSampleSize || "")} disabled={samplingMode === "full"} onChange={(e) => setSampleSize(e.target.value)} /></label>
        <label className="text-sm font-semibold">Inspector<Input className="mt-1 font-normal" value={inspector} placeholder="Defaults to you" onChange={(e) => setInspector(e.target.value)} /></label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Company AQL {data.aql} (an administrator sets it in System Settings). Suggested sample {data.suggestedSampleSize || "—"} for this lot, acceptance number {data.suggestedMaxDefects}. {data.plan}</p>
    </details>
  );

  const begin = async (nextPurpose: "awaiting" | "held", midProduction = false) => {
    if (busy) return;
    const requestId = startRequest ?? crypto.randomUUID();
    const covered = nextPurpose === "held" ? heldLines().reduce((total, row) => total + row.qty, 0) : data.awaiting;
    const asked = samplingMode === "full" ? covered : Number(sampleSize || data.suggestedSampleSize || covered);
    setStartRequest(requestId); setBusy(true); setError(null);
    try {
      await apiPost("/quality/tasks/start", {
        taskKey: data.taskKey, requestId,
        stage: nextPurpose === "held" || !midProduction ? "Final" : "Inline",
        purpose: nextPurpose, samplingMode,
        sampleSize: Math.min(Math.max(asked, 1), Math.max(covered, 1)),
        inspector,
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

  const markAllPass = async () => {
    if (!inspection || busy) return;
    setBusy(true); setError(null);
    try {
      await Promise.all(inspection.checks.filter((row) => row.result === "Pending").map((row) => apiPut(`/quality/checks/${row.publicId}`, {
        criterion: row.criterion, requirement: row.requirement, actual: row.actual, result: "Pass", notes: row.notes,
        targetValue: row.targetValue, tolerance: row.tolerance,
      })));
      reload();
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };

  const addCheck = async () => {
    setError(null);
    const targetValue = optionalNumber(check.target);
    const tolerance = optionalNumber(check.tolerance);
    if (Number.isNaN(targetValue) || Number.isNaN(tolerance)) { setError("Target and tolerance must be numbers."); return; }
    try {
      await apiPost(`/quality/inspections/${inspection?.publicId}/checks`, {
        criterion: check.criterion, requirement: check.requirement, actual: check.actual, targetValue, tolerance, result: "Pending",
      });
      setCheck({ criterion: "", requirement: "", target: "", tolerance: "", actual: "" });
      reload();
    } catch (error) { setError(message(error)); }
  };

  const addDefect = async () => {
    setError(null);
    const fromCatalog = defect.typeId && defect.typeId !== NEW_DEFECT;
    if (!fromCatalog && !defect.defectName.trim()) { setError("Choose a defect type or enter a new defect name."); return; }
    try {
      await apiPost(`/quality/inspections/${inspection?.publicId}/defects`, {
        defectTypeId: fromCatalog ? defect.typeId : null,
        qtyAffected: Number(defect.qtyAffected) || 1,
        description: defect.description, imageDocId: defect.imageDocId || null,
        newDefect: fromCatalog ? null : { name: defect.defectName.trim(), category: "Workmanship", severity: defect.severity },
      });
      setDefect({ typeId: "", defectName: "", severity: "Major", qtyAffected: "1", description: "", imageDocId: "" });
      if (!fromCatalog) defectOptions.refetch();
      reload();
    } catch (error) { setError(message(error)); }
  };

  const decide = async () => {
    if (!inspection || busy) return;
    const requestId = decideRequest ?? crypto.randomUUID();
    setDecideRequest(requestId); setBusy(true); setError(null);
    const allocations = reserved.map((row) => {
      const c = cell(row);
      return { sourceId: row.sourceId, approved: whole(c.approved), held: whole(c.held), rejected: whole(c.rejected) };
    });
    const decision = inspection.stage === "In-line" ? "inline"
      : totals.approved === totals.qty ? "approve_all"
      : totals.held === totals.qty ? "hold_all" : "split";
    try {
      await apiPost("/quality/tasks/decide", { taskKey: data.taskKey, requestId, decision, exceptionReason, allocations });
      setDecideRequest(null); setSplit({}); setExceptionReason(""); reload();
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
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

  const tiles: [string, number][] = [["To inspect", data.awaiting], ["Released", data.approved], ["On hold", data.held], ["Rejected", data.rejected]];

  return (
    <>
    <PageHeader crumb="Quality · Inspection" title={data.article} />
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <Link href="/quality/inspections" className="text-sm font-semibold text-primary hover:underline">Back to quality queue</Link>
      {error && <Notice tone="red">{error}</Notice>}
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">{data.orderRef} · PO {data.poRef || "—"} · {data.supplier || "No supplier"} · {data.scope}</p>
        <p className="mt-2 flex items-center gap-2 text-sm">Status <ToneBadge tone={statusTone(data.status)}>{data.status}</ToneBadge></p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {tiles.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted px-3 py-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-lg font-semibold">{value}</dd></div>
          ))}
        </dl>
        {data.legacyNote && <Notice tone="amber" className="mt-2">{data.legacyNote}</Notice>}
        {data.reworkOpen && <Notice tone="amber" className="mt-2">Production rework is open. Final reinspection stays blocked until that article's production stages are complete.</Notice>}
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link className="font-semibold text-primary hover:underline" href={data.links.production}>Production</Link>
          {data.links.purchaseOrder && <Link className="font-semibold text-primary hover:underline" href={data.links.purchaseOrder}>Purchase order</Link>}
          <Link className="font-semibold text-primary hover:underline" href={data.links.shipments}>Shipments</Link>
          <Link className="font-semibold text-primary hover:underline" href={data.links.inventory}>Inventory</Link>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <header className="border-b border-border/60 px-5 py-3"><h2 className="font-bold">Colour and size</h2></header>
        <Table>
          <TableHeader><TableRow><TableHead>Colour / size</TableHead><TableHead className="text-center">To inspect</TableHead><TableHead className="text-center">On hold</TableHead><TableHead className="text-center">Released</TableHead><TableHead className="text-center">Rejected</TableHead></TableRow></TableHeader>
          <TableBody>{data.sources.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-semibold">{colourSize(row, data.article)}</TableCell>
              <TableCell className="text-center tabular-nums">{row.awaiting}</TableCell>
              <TableCell className="text-center tabular-nums">{row.held}</TableCell>
              <TableCell className="text-center tabular-nums">{row.approved}</TableCell>
              <TableCell className="text-center tabular-nums">{row.rejected}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </Card>

      {(!inspection || needsReservation) && (data.awaiting > 0 || needsReservation) && (
        <Card className="p-5">
          <h2 className="font-bold">Inspect finished pieces</h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.awaiting} pieces are waiting. You inspect a sample, then decide what happens to all {data.awaiting} pieces, colour by colour and size by size.</p>
          {needsReservation && <Notice tone="amber" className="mt-2">This inspection is open but has not reserved a quantity. Start it to lock the pieces this decision covers.</Notice>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => begin("awaiting")}>Start inspection</Button>
            {!needsReservation && <Button type="button" variant="outline" disabled={busy} onClick={() => begin("awaiting", true)}>Mid-production check</Button>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">A mid-production check records pass or fail only. It does not release, hold or reject pieces.</p>
          {advanced(data.awaiting)}
        </Card>
      )}

      {inspection && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">Checks and defects · {inspection.inspectionNo}</h2>
              <p className="text-sm text-muted-foreground">{inspection.stage === "In-line" ? "Mid-production check" : inspection.stage} · sample {inspection.sampleSize ?? "—"} · lot covered {inspection.lotQty ?? "not a release"} · defects {inspection.defectCount} / limit {inspection.maxDefects ?? "—"}</p>
            </div>
            {inspection.checks.some((row) => row.result === "Pending") && (
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={markAllPass}>Mark all pending as pass</Button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {inspection.checks.map((row) => (
              <div key={row.publicId} className="grid items-center gap-2 rounded-lg border border-border/70 p-2 sm:grid-cols-[1fr_120px_1fr_auto]">
                <div>
                  <strong>{row.criterion}</strong>
                  <p className="text-xs text-muted-foreground">{row.requirement}{row.targetValue !== null && row.tolerance !== null ? ` · target ${row.targetValue} ± ${row.tolerance}` : ""}</p>
                </div>
                <Input defaultValue={row.actual ?? ""} placeholder="Actual" onBlur={(e) => saveCheck(row, { actual: e.target.value })} />
                <Input defaultValue={row.notes ?? ""} placeholder="Notes" onBlur={(e) => saveCheck(row, { notes: e.target.value })} />
                <NativeSelect value={row.result} onChange={(e) => saveCheck(row, { result: e.target.value })}>
                  {["Pending", "Pass", "Fail", "Warning", "NA"].map((item) => <option key={item}>{item}</option>)}
                </NativeSelect>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-6">
            <Input placeholder="Check" value={check.criterion} onChange={(e) => setCheck({ ...check, criterion: e.target.value })} />
            <Input placeholder="Requirement" value={check.requirement} onChange={(e) => setCheck({ ...check, requirement: e.target.value })} />
            <Input placeholder="Target" inputMode="decimal" value={check.target} onChange={(e) => setCheck({ ...check, target: e.target.value })} />
            <Input placeholder="± Tolerance" inputMode="decimal" value={check.tolerance} onChange={(e) => setCheck({ ...check, tolerance: e.target.value })} />
            <Input placeholder="Actual" value={check.actual} onChange={(e) => setCheck({ ...check, actual: e.target.value })} />
            <Button type="button" variant="outline" onClick={addCheck}>Add check</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">With a target and tolerance, the result is set automatically from the actual value.</p>

          <h3 className="mt-4 font-bold">Defects</h3>
          {inspection.defects.length === 0 && <p className="text-sm text-muted-foreground">No defects logged.</p>}
          {inspection.defects.map((row) => <p key={row.publicId} className="text-sm">{row.name} · {row.severity} · {row.qty}{row.notes ? ` · ${row.notes}` : ""} <button type="button" className="font-semibold text-primary hover:underline" onClick={() => apiDelete(`/quality/defects/log/${row.publicId}`).then(reload).catch((error) => setError(message(error)))}>Remove</button></p>)}
          <div className="mt-2 grid gap-2 sm:grid-cols-5">
            <NativeSelect aria-label="Defect type" value={defect.typeId} onChange={(e) => setDefect({ ...defect, typeId: e.target.value })}>
              <option value="">Choose defect…</option>
              {(defectOptions.data?.options ?? []).map((option) => <option key={option.publicId} value={option.publicId}>{option.name}{option.severity ? ` · ${option.severity}` : ""}</option>)}
              <option value={NEW_DEFECT}>Other (new defect)</option>
            </NativeSelect>
            {defect.typeId === NEW_DEFECT ? <>
              <Input placeholder="New defect name" value={defect.defectName} onChange={(e) => setDefect({ ...defect, defectName: e.target.value })} />
              <NativeSelect aria-label="Severity" value={defect.severity} onChange={(e) => setDefect({ ...defect, severity: e.target.value })}><option>Critical</option><option>Major</option><option>Minor</option></NativeSelect>
            </> : <p className="self-center text-xs text-muted-foreground sm:col-span-2">Severity comes from the defect type.</p>}
            <Input placeholder="Qty" value={defect.qtyAffected} onChange={(e) => setDefect({ ...defect, qtyAffected: e.target.value })} />
            <Input placeholder="Notes" value={defect.description} onChange={(e) => setDefect({ ...defect, description: e.target.value })} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="text-sm">{defect.imageDocId ? "Photo attached" : "Photo"} <input type="file" accept="image/*" className="text-xs" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              try {
                const form = new FormData(); form.append("module", "quality"); form.append("entity_type", "inspection:defect"); form.append("file", file);
                const uploaded = await apiUpload<{ public_id: string }>("/documents/upload", form);
                setDefect((current) => ({ ...current, imageDocId: uploaded.public_id }));
              } catch (error) { setError(message(error)); }
            }} /></label>
            <Button type="button" variant="outline" disabled={!defect.typeId} onClick={addDefect}>Add defect</Button>
          </div>
        </Card>
      )}

      {inspection && !needsReservation && (
        <Card className="p-5">
          <h2 className="font-bold">Decision</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">{inspection.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          {inspection.stage === "Final" ? (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Fill every colour and size:</span>
                <Button type="button" size="sm" variant="outline" onClick={() => fillAll("approved")}>Approve all</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => fillAll("held")}>Hold all</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => fillAll("rejected")}>Reject all</Button>
                <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setSplit({})}>Reset to suggested</button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead className="px-0">Colour / size</TableHead><TableHead className="text-center">In this inspection</TableHead><TableHead>Approve</TableHead><TableHead>Hold</TableHead><TableHead>Reject</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reserved.map((row) => {
                    const current = cell(row);
                    const issue = rowIssue(row);
                    return (
                      <TableRow key={row.sourceId}>
                        <TableCell className="px-0">{colourSize(sourceFor(row.sourceId), String(row.sourceId))}</TableCell>
                        <TableCell className="text-center tabular-nums">{row.qty}</TableCell>
                        {(["approved", "held", "rejected"] as const).map((field) => (
                          <TableCell key={field}>
                            <Input className="w-20" inputMode="numeric" aria-invalid={!!issue} aria-label={`${field} for ${colourSize(sourceFor(row.sourceId), "row")}`} value={current[field]} onChange={(e) => setSplit({ ...split, [row.sourceId]: { ...current, [field]: e.target.value } })} />
                            {issue && field === "rejected" && <span className="mt-1 block text-xs text-destructive">{issue}</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="px-0 font-semibold">Total</TableCell>
                    <TableCell className="text-center font-semibold tabular-nums">{totals.qty}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{totals.approved}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{totals.held}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{totals.rejected}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {!inspection.accepted && <Notice tone="amber">This lot did not meet the acceptance rules, so the suggestion is to hold it. Approving any pieces needs an exception reason from someone with release-exception permission.</Notice>}
              {needsException && (
                <label className="block text-sm font-semibold">Exception reason {data.canReleaseException ? "" : "(administrator required)"}
                  <Input className="mt-1 font-normal" value={exceptionReason} disabled={!data.canReleaseException} onChange={(e) => setExceptionReason(e.target.value)} />
                </label>
              )}
            </div>
          ) : <p className="mt-2 text-sm">A mid-production check records the result only. It does not approve, hold, or reject pieces.</p>}
          <Button type="button" className="mt-3" disabled={busy || (inspection.stage === "Final" && decisionBlocked)} onClick={decide}>
            {inspection.stage === "Final" ? "Complete inspection" : "Record result"}
          </Button>
        </Card>
      )}

      {!inspection && data.held > 0 && (
        <Card className="p-5">
          <h2 className="font-bold">Pieces on hold</h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.held} pieces are on hold. The {data.approved} released pieces stay released. Choose the pieces, then one action.</p>
          {heldTable}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => begin("held")}>Reinspect selected pieces</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Reinspecting opens the checklist. It does not release the pieces yet.</p>
          {advanced(heldLines().reduce((total, row) => total + row.qty, 0))}
          <label className="mt-4 block text-sm font-semibold">Reason, required to send back or reject
            <Input className="mt-1 font-normal" value={resolveReason} onChange={(e) => setResolveReason(e.target.value)} />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => resolve("rework")}>Send back to production</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => resolve("reject")}>Reject selected pieces</Button>
          </div>
        </Card>
      )}

      <details className="rounded-[14px] border border-border/70 bg-card p-5 shadow-erp-sm">
        <summary className="cursor-pointer font-bold">Inspection history</summary>
        <div className="mt-3 space-y-1 text-sm">
          {data.history.length === 0 && <p className="text-muted-foreground">No earlier inspections.</p>}
          {data.history.map((row) => <p key={`${row.inspectionNo}-${row.result}`}>{row.inspectionNo} · {row.stage === "In-line" ? "Mid-production" : row.stage} · {row.result}{row.legacy ? " · legacy, quantities not recorded" : ""}{row.decision ? ` · ${row.decision}` : ""} · released {row.approved ?? "—"} on hold {row.held ?? "—"} rejected {row.rejected ?? "—"}</p>)}
        </div>
      </details>
    </div>
    </>
  );
}
