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
import { QcShip } from "@/components/screens/quality/qc-ship";

type Variant = { color: string | null; size: string | null; qty: number };
type Source = { id: number; variants?: Variant[]; color: string | null; size: string | null; sku: string | null; awaiting: number; held: number; approved: number; rejected: number; tnaComplete: boolean };
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
  status: string; legacy: boolean; legacyNote: string | null; aql: string; inProduction?: boolean; plannedQty?: number; suggestedSampleSize: number; suggestedMaxDefects: number;
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

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];
const sizeRank = (size: string) => { const i = SIZE_ORDER.indexOf(size.toUpperCase()); return i === -1 ? SIZE_ORDER.length : i; };
const swatch = (name: string) => {
  const css = name.replace(/\s+/g, "").toLowerCase();
  return typeof CSS !== "undefined" && CSS.supports("color", css) ? css : "#C9CCD3";
};
const MEASURES = [["inspect", "To inspect"], ["held", "On hold"], ["approved", "Released"], ["rejected", "Rejected"]] as const;
type Measure = (typeof MEASURES)[number][0];

/** Colour × size grid of the pieces being inspected, like the catalog variant matrix. */
function SizeBreakdown({ sources, article, inspected }: { sources: Source[]; article: string; inspected: { sourceId: number; qty: number }[] | null }) {
  const [measure, setMeasure] = useState<Measure>("inspect");
  const valueOf = (row: Source): number => {
    if (measure === "inspect") return inspected ? inspected.filter((entry) => entry.sourceId === row.id).reduce((sum, entry) => sum + entry.qty, 0) : row.awaiting;
    return measure === "held" ? row.held : measure === "approved" ? row.approved : row.rejected;
  };
  // A source can cover several colours and sizes; share its quantity across them in
  // proportion to what was ordered (exact whenever the whole order is in view).
  const cells = sources.flatMap((row) => {
    const value = valueOf(row);
    const parts = (row.variants ?? []).filter((v) => v.qty > 0);
    if (parts.length === 0) return [{ colour: row.color || "No colour", size: row.size || "—", value }];
    const base = parts.reduce((sum, v) => sum + v.qty, 0);
    const shares = parts.map((v) => ({ v, exact: value * v.qty / base }));
    const given = shares.map((s) => Math.floor(s.exact));
    let left = value - given.reduce((sum, n) => sum + n, 0);
    [...shares.keys()].sort((a, b) => (shares[b].exact - given[b]) - (shares[a].exact - given[a]))
      .forEach((i) => { if (left > 0) { given[i] += 1; left -= 1; } });
    return parts.map((v, i) => ({ colour: v.color || "No colour", size: v.size || "—", value: given[i] }));
  });
  const colours = [...new Set(cells.map((c) => c.colour))];
  const sizes = [...new Set(cells.map((c) => c.size))].sort((a, b) => sizeRank(a) - sizeRank(b));
  const cellValue = (colour: string, size: string) => cells
    .filter((c) => c.colour === colour && c.size === size).reduce((sum, c) => sum + c.value, 0);
  const total = cells.reduce((sum, c) => sum + c.value, 0);
  return (
    <div className="p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {MEASURES.map(([id, label]) => (
          <Button key={id} type="button" size="sm" variant={measure === id ? "navy" : "outline"} onClick={() => setMeasure(id)}>
            {id === "inspect" && inspected ? "In this inspection" : label}
          </Button>
        ))}
        <span className="ml-auto text-sm font-semibold">Total: {total}</span>
      </div>
      {cells.every((c) => c.colour === "No colour" && c.size === "—") && (
        <p className="mb-2 text-xs text-muted-foreground">{article} has no colour or size set, so all pieces are counted together.</p>
      )}
      <div className="overflow-x-auto">
        <Table className="w-full text-[13px]">
          <TableHeader><TableRow>
            <TableHead>Colour</TableHead>
            {sizes.map((size) => <TableHead key={size} className="text-center">{size}</TableHead>)}
            <TableHead className="text-center">Total</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {colours.map((colour) => {
              const rowTotal = sizes.reduce((sum, size) => sum + cellValue(colour, size), 0);
              return (
                <TableRow key={colour}>
                  <TableCell><span className="flex items-center gap-2 font-semibold">
                    <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: swatch(colour) }} />{colour}</span></TableCell>
                  {sizes.map((size) => {
                    const value = cellValue(colour, size);
                    return <TableCell key={size} className="px-1">
                      <div className={`rounded-lg py-2 text-center font-bold tabular-nums ${value > 0 ? "bg-primary/10 text-foreground" : "bg-muted/50 text-muted-foreground"}`}>{value}</div>
                    </TableCell>;
                  })}
                  <TableCell className="text-center font-extrabold tabular-nums">{rowTotal}</TableCell>
                </TableRow>
              );
            })}
            {colours.length > 1 && (
              <TableRow>
                <TableCell className="font-extrabold">Total</TableCell>
                {sizes.map((size) => <TableCell key={size} className="text-center font-bold tabular-nums">
                  {colours.reduce((sum, colour) => sum + cellValue(colour, size), 0)}</TableCell>)}
                <TableCell className="text-center font-extrabold tabular-nums">{total}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
  const [measure, setMeasureKind] = useState(false);
  const [defect, setDefect] = useState({ typeId: "", defectName: "", severity: "Major", qtyAffected: "1", description: "", imageDocId: "" });
  const [exceptionReason, setExceptionReason] = useState("");
  const [split, setSplit] = useState<Record<number, Split>>({});
  const [resolveReason, setResolveReason] = useState("");
  const [holdPick, setHoldPick] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"checks" | "decide">("checks");
  const reload = () => client.invalidateQueries({ queryKey: ["quality", "task", taskKey] });

  if (!taskKey) return <p className="p-6 text-sm">Choose an inspection from the quality queue.</p>;
  if (task.isLoading) return <div className="p-6"><LoadingBlock rows={4} /></div>;
  if (task.isError || !task.data) return <div className="p-6"><Notice tone="red">{message(task.error)}</Notice></div>;
  const data = task.data;
  const inspection = data.inspection;
  const needsReservation = !!inspection && inspection.stage === "Final" && inspection.reservations.length === 0;
  const sourceFor = (id: number) => data.sources.find((item) => item.id === id);
  const lot = inspection?.lotQty ?? inspection?.sampleSize ?? data.plannedQty ?? 0;
  const percentOf = (pieces: number) => lot ? Math.round(pieces * 10000 / lot) / 100 : null;
  const livePercent = Number(check.tolerance.replace("%", "").trim());
  const tolerancePreview = check.tolerance.trim() !== "" && lot && Number.isFinite(livePercent) ? Math.round(livePercent * lot) / 100 : null;
  const liveTarget = Number(check.target);
  const rangeText = tolerancePreview !== null && check.target.trim() !== "" && Number.isFinite(liveTarget) ? `${Math.round((liveTarget - tolerancePreview) * 100) / 100} to ${Math.round((liveTarget + tolerancePreview) * 100) / 100}` : null;

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
      <summary className="cursor-pointer text-sm font-semibold">Change how many pieces to check, or the inspector</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold">What to check<NativeSelect className="mt-1 font-normal" value={samplingMode} onChange={(e) => setSamplingMode(e.target.value as "sample" | "full")}><option value="sample">A sample of the pieces</option><option value="full">Every piece (100%)</option></NativeSelect></label>
        <label className="text-sm font-semibold">Pieces to check<Input className="mt-1 font-normal" value={samplingMode === "full" ? String(covered) : sampleSize} placeholder={String(data.suggestedSampleSize || "")} disabled={samplingMode === "full"} onChange={(e) => setSampleSize(e.target.value)} /></label>
        <label className="text-sm font-semibold">Inspector<Input className="mt-1 font-normal" value={inspector} placeholder="Defaults to you" onChange={(e) => setInspector(e.target.value)} /></label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Suggested: check {data.suggestedSampleSize || "—"} pieces from this lot; up to {data.suggestedMaxDefects} faulty pieces are allowed. (Company AQL {data.aql}, set by an administrator in System Settings.) {data.plan}</p>
    </details>
  );

  const begin = async (nextPurpose: "awaiting" | "held", midProduction = false) => {
    if (busy) return;
    const requestId = startRequest ?? crypto.randomUUID();
    const covered = nextPurpose === "held" ? heldLines().reduce((total, row) => total + row.qty, 0)
      : midProduction && data.awaiting === 0 ? data.plannedQty ?? 0 : data.awaiting;
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
    const percent = optionalNumber(check.tolerance.replace("%", ""));
    if (Number.isNaN(targetValue) || Number.isNaN(percent)) { setError("Target and tolerance must be numbers."); return; }
    if (percent !== null && (percent < 0 || percent > 100)) { setError("Tolerance is a percentage between 0 and 100."); return; }
    if (percent !== null && !lot) { setError("This inspection covers no pieces, so a percentage tolerance cannot be worked out."); return; }
    // The user enters a percentage of the lot; the allowed number of pieces is worked out here.
    const tolerance = percent === null ? null : Math.round(percent * lot) / 100;
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

  const decide = async (all?: keyof Split) => {
    if (!inspection || busy) return;
    const requestId = decideRequest ?? crypto.randomUUID();
    setDecideRequest(requestId); setBusy(true); setError(null);
    // One-click outcomes send the whole lot to a single result; the table sends the split.
    const allocations = reserved.map((row) => {
      if (all) return { sourceId: row.sourceId, approved: all === "approved" ? row.qty : 0, held: all === "held" ? row.qty : 0, rejected: all === "rejected" ? row.qty : 0 };
      const c = cell(row);
      return { sourceId: row.sourceId, approved: whole(c.approved), held: whole(c.held), rejected: whole(c.rejected) };
    });
    const decision = inspection.stage === "In-line" ? "inline"
      : all === "approved" || (!all && totals.approved === totals.qty) ? "approve_all"
      : all === "held" || (!all && totals.held === totals.qty) ? "hold_all" : "split";
    try {
      await apiPost("/quality/tasks/decide", { taskKey: data.taskKey, requestId, decision, exceptionReason, allocations });
      setDecideRequest(null); setSplit({}); setExceptionReason(""); setStep("checks"); reload();
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
        <details open>
        <summary className="cursor-pointer border-b border-border/60 px-5 py-3 font-bold">Colour and size</summary>
        <SizeBreakdown sources={data.sources} article={data.article} inspected={inspection?.reservations ?? null} />
        </details>
      </Card>

      {inspection && !needsReservation && (
        <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Inspection steps">
          <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2E9E6B] text-xs font-bold text-white">✓</span><span className="text-muted-foreground">Start inspection</span><span className="mx-1 h-px w-6 bg-border" /></li>
          {([["checks", "2", "Checks and defects"], ["decide", "3", "Decision"]] as const).map(([id, number, label]) => (
            <li key={id} className="flex items-center gap-2">
              <button type="button" onClick={() => setStep(id)} className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === id ? "bg-[#2563EB] text-white" : "bg-[#E3E5EA] text-foreground"}`}>{number}</span>
                <span className={step === id ? "font-bold" : "text-muted-foreground"}>{label}</span>
              </button>
              {id === "checks" && <span className="mx-1 h-px w-6 bg-border" />}
            </li>
          ))}
        </ol>
      )}

      {!inspection && data.approved > 0 && (
        <>
          <Card className="border-[#2E9E6B]/40 bg-[#2E9E6B]/5 p-5">
            <h2 className="font-bold">{data.approved} pieces released</h2>
            <p className="text-sm text-muted-foreground">These pieces passed quality and can now be shipped.</p>
          </Card>
          <QcShip poRef={data.poRef} orderRef={data.orderRef} article={data.article} />
        </>
      )}

      {(!inspection || needsReservation) && (data.awaiting > 0 || needsReservation || data.inProduction) && (
        <Card className="p-5">
          <h2 className="font-bold">Inspect finished pieces</h2>
          {data.awaiting > 0
            ? <p className="mt-1 text-sm text-muted-foreground">{data.awaiting} pieces are waiting. You inspect a sample, then decide what happens to all {data.awaiting} pieces, colour by colour and size by size.</p>
            : <p className="mt-1 text-sm text-muted-foreground">Production is still running for this article ({data.plannedQty ?? 0} pieces planned). You can run a mid-production check at any stage.</p>}
          {needsReservation && <Notice tone="amber" className="mt-2">This inspection is open but has not reserved a quantity. Start it to lock the pieces this decision covers.</Notice>}
          <div className="mt-3 flex flex-wrap gap-2">
            {(data.awaiting > 0 || needsReservation) && <Button type="button" disabled={busy} onClick={() => begin("awaiting")}>Start inspection</Button>}
            {!needsReservation && <Button type="button" variant={data.awaiting > 0 ? "outline" : "default"} disabled={busy} onClick={() => begin("awaiting", true)}>Mid-production check</Button>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">A mid-production check records pass or fail only. It does not release, hold or reject pieces.</p>
          {advanced(data.awaiting)}
        </Card>
      )}

      {inspection && (step === "checks" || needsReservation) && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">Checks and defects · {inspection.inspectionNo}</h2>
              <p className="text-sm text-muted-foreground">{inspection.stage === "In-line" ? "Mid-production check" : inspection.stage} · checking {inspection.sampleSize ?? "—"} pieces · covers {inspection.lotQty ?? "no pieces (check only)"} · faults found {inspection.defectCount} (up to {inspection.maxDefects ?? "—"} allowed)</p>
            </div>
            {inspection.checks.some((row) => row.result === "Pending") && (
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={markAllPass}>Mark all as passed</Button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {inspection.checks.map((row) => (
              <div key={row.publicId} className="rounded-lg border border-border/70 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <strong>{row.criterion}</strong>
                    <p className="text-xs text-muted-foreground">{row.requirement}{row.targetValue !== null && row.tolerance !== null ? ` · target ${row.targetValue} ± ${row.tolerance} pieces${percentOf(row.tolerance) !== null ? ` (${percentOf(row.tolerance)}% of ${lot})` : ""}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1" role="group" aria-label={`Result for ${row.criterion}`}>
                    <Button type="button" size="sm" className="h-9 min-w-14" variant={row.result === "Pass" ? "default" : "outline"} onClick={() => saveCheck(row, { result: "Pass" })}>Pass</Button>
                    <Button type="button" size="sm" className="h-9 min-w-14" variant={row.result === "Fail" ? "destructive" : "outline"} onClick={() => saveCheck(row, { result: "Fail" })}>Fail</Button>
                    <Button type="button" size="sm" className="h-9" variant={row.result === "Warning" ? "navy" : "outline"} onClick={() => saveCheck(row, { result: "Warning" })}>Warning</Button>
                    <Button type="button" size="sm" className="h-9" variant={row.result === "NA" ? "navy" : "outline"} onClick={() => saveCheck(row, { result: "NA" })}>N/A</Button>
                    <Button type="button" size="sm" className="h-9 text-destructive" variant="ghost" aria-label={`Delete check ${row.criterion}`}
                      onClick={() => { if (window.confirm(`Delete the check “${row.criterion}”?`)) apiDelete(`/quality/checks/${row.publicId}`).then(reload).catch((err) => setError(message(err))); }}>Delete</Button>
                  </div>
                </div>
                <details className="mt-1" open={!!(row.actual || row.notes) || row.targetValue !== null}>
                  <summary className="cursor-pointer text-xs font-semibold text-primary">Measurement and notes</summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[160px_1fr]">
                    <Input defaultValue={row.actual ?? ""} placeholder="Actual" onBlur={(e) => saveCheck(row, { actual: e.target.value })} />
                    <Input defaultValue={row.notes ?? ""} placeholder="Notes" onBlur={(e) => saveCheck(row, { notes: e.target.value })} />
                  </div>
                </details>
              </div>
            ))}
          </div>
          <details className="mt-3 rounded-lg border border-border/70 px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">Add your own check</summary>
            <p className="mt-2 text-sm text-muted-foreground">Add a point the inspector should look at that is not already in the list.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">What to check
                <Input className="mt-1 font-normal" placeholder="e.g. Stitching, Chest width, Label position" value={check.criterion} onChange={(e) => setCheck({ ...check, criterion: e.target.value })} /></label>
              <label className="block text-sm font-semibold">What good looks like <span className="font-normal text-muted-foreground">(optional)</span>
                <Input className="mt-1 font-normal" placeholder="e.g. No loose threads" value={check.requirement} onChange={(e) => setCheck({ ...check, requirement: e.target.value })} /></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={measure} onChange={(e) => { setMeasureKind(e.target.checked); if (!e.target.checked) setCheck({ ...check, target: "", tolerance: "", actual: "" }); }} />
              This is a count or measurement, not just pass or fail
            </label>
            {measure && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm font-semibold">Expected number
                  <Input className="mt-1 font-normal" inputMode="decimal" placeholder="e.g. 30" value={check.target} onChange={(e) => setCheck({ ...check, target: e.target.value })} /></label>
                <label className="block text-sm font-semibold">Allowed difference, % of lot
                  <Input className="mt-1 font-normal" inputMode="decimal" placeholder="e.g. 5" value={check.tolerance} onChange={(e) => setCheck({ ...check, tolerance: e.target.value })} /></label>
                <label className="block text-sm font-semibold">Number you found <span className="font-normal text-muted-foreground">(optional now)</span>
                  <Input className="mt-1 font-normal" inputMode="decimal" value={check.actual} onChange={(e) => setCheck({ ...check, actual: e.target.value })} /></label>
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  {rangeText ? `5% of ${lot} pieces is ${tolerancePreview}, so it passes if the number found is ${rangeText}.`.replace("5%", `${livePercent}%`) : `Passes when the number found is close enough to the expected number. The lot is ${lot || "—"} pieces.`}
                </p>
              </div>
            )}
            <Button type="button" className="mt-3" variant="outline" disabled={!check.criterion.trim()} onClick={addCheck}>Add check</Button>
          </details>

          <h3 className="mt-4 font-bold">Defects found</h3>
          {inspection.defects.length === 0 && <p className="text-sm text-muted-foreground">None logged. Use “Log a defect” below only if you find faulty pieces.</p>}
          {inspection.defects.map((row) => <p key={row.publicId} className="text-sm">{row.name} · {row.severity} · {row.qty}{row.notes ? ` · ${row.notes}` : ""} <button type="button" className="font-semibold text-primary hover:underline" onClick={() => apiDelete(`/quality/defects/log/${row.publicId}`).then(reload).catch((error) => setError(message(error)))}>Remove</button></p>)}
          <details className="mt-2 rounded-lg border border-border/70 px-3 py-2" open={inspection.defects.length === 0 && inspection.checks.some((row) => row.result === "Fail") ? true : undefined}>
          <summary className="cursor-pointer text-sm font-semibold">Log a defect</summary>
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
          </details>
          {!needsReservation && <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{inspection.checks.filter((row) => row.result !== "Pending").length} of {inspection.checks.length} checks done{inspection.checks.some((row) => row.result === "Fail") ? " · some failed" : ""}</span>
            <Button type="button" onClick={() => setStep("decide")}>Next: Decision</Button></div>}
        </Card>
      )}

      {inspection && !needsReservation && step === "decide" && (
        <Card className="p-5">
          <button type="button" className="mb-2 text-sm font-semibold text-primary hover:underline" onClick={() => setStep("checks")}>← Back to checks and defects</button>
          <h2 className="font-bold">Decision</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">{inspection.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          {inspection.stage === "Final" ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm font-semibold">{inspection.accepted ? "This lot passed. What should happen to all " : "This lot did not pass. What should happen to all "}{totals.qty} pieces?</p>
              {!inspection.accepted && <Notice tone="amber">Releasing a lot that did not meet the acceptance rules needs an exception reason from someone with release-exception permission.</Notice>}
              {!inspection.accepted && (
                <label className="block text-sm font-semibold">Exception reason, only needed to release {data.canReleaseException ? "" : "(administrator required)"}
                  <Input className="mt-1 font-normal" value={exceptionReason} disabled={!data.canReleaseException} onChange={(e) => setExceptionReason(e.target.value)} />
                </label>
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                <Button type="button" size="lg" variant={inspection.accepted ? "default" : "outline"} disabled={busy || (!inspection.accepted && (!data.canReleaseException || !exceptionReason.trim()))} onClick={() => decide("approved")}>Release all {totals.qty}</Button>
                <Button type="button" size="lg" variant={inspection.accepted ? "outline" : "default"} disabled={busy} onClick={() => decide("held")}>Hold all {totals.qty}</Button>
                <Button type="button" size="lg" variant="outline" disabled={busy} onClick={() => decide("rejected")}>Reject all {totals.qty}</Button>
              </div>
              <details className="rounded-lg border border-border/70 px-3 py-2">
              <summary className="cursor-pointer text-sm font-semibold">Split by colour and size instead</summary>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Set every colour and size to:</span>
                <Button type="button" size="sm" variant="outline" onClick={() => fillAll("approved")}>Release all</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => fillAll("held")}>Hold all</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => fillAll("rejected")}>Reject all</Button>
                <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setSplit({})}>Reset to suggestion</button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead className="px-0">Colour / size</TableHead><TableHead className="text-center">Pieces</TableHead><TableHead>Approve</TableHead><TableHead>Hold</TableHead><TableHead>Reject</TableHead></TableRow></TableHeader>
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
              <Button type="button" className="mt-3" variant="outline" disabled={busy || decisionBlocked} onClick={() => decide()}>Save this split</Button>
              </details>
            </div>
          ) : <>
            <p className="mt-2 text-sm">A mid-production check records the result only. It does not release, hold or reject pieces.</p>
            <Button type="button" className="mt-3" disabled={busy} onClick={() => decide()}>Record result</Button>
          </>}
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
