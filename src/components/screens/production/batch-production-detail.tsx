"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table as ResponsiveTable } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceFormSheet, type FinanceField } from "@/components/screens/finance/finance-form-sheet";
import { ProductionStartModal } from "./production-start-modal";
import { LineTimeline, type LineTL, type Stage as TimelineStage } from "./production-order-detail";
import type { Batch, Data, Line, Stage } from "./batch-workspace";

function timeline(stages: Stage[]): Pick<LineTL, "started" | "progress" | "statusLabel" | "statusTone" | "alert" | "stages"> {
  const ordered = [...stages].sort((a, b) => a.id - b.id);
  const started = ordered.some((stage) => stage.name !== "Tech Pack" && stage.status !== "Pending");
  const done = ordered.filter((stage) => stage.status === "Completed" || stage.status === "Received").length;
  const complete = ordered.length > 0 && done === ordered.length;
  const overdue = ordered.find((stage) => stage.overdue);
  return {
    started,
    progress: Math.round(100 * done / Math.max(1, ordered.length)),
    statusLabel: complete ? "Completed" : started ? "In Progress" : "Planned",
    statusTone: complete ? "green" : started ? "accent" : "neutral",
    alert: overdue ? { type: "overdue", message: `${overdue.name} is overdue. Complete or extend this stage.` } : null,
    stages: ordered.map((stage): TimelineStage => ({
      public_id: String(stage.id), seq: stage.id, name: stage.name,
      duration_days: stage.durationDays, status: stage.status, overdue: stage.overdue,
      start: stage.startOn || "—", end: stage.endOn || "—",
      worker: stage.worker || "Unassigned", notes: stage.notes || "",
    })),
  };
}

function ProducedQuantity({ batch, line, ready }: { batch: Batch; line: Line; ready: boolean }) {
  const client = useQueryClient();
  const { canWrite } = useModuleAccess("production");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const remaining = line.planned - line.completed;
  if (!remaining) return <p className="text-sm text-green-700">{line.completed} of {line.planned} pieces produced</p>;
  return <form className="flex flex-wrap items-end gap-3 rounded-lg border p-3" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      await apiPost(`/batches/${batch.publicId}/lines/${line.id}/complete`, {
        qty: Number(values.get("qty")), reason: String(values.get("reason") || "Production completed"),
        requestId: crypto.randomUUID(),
      });
      form.reset();
      await client.invalidateQueries({ queryKey: ["batches"] });
      await client.invalidateQueries({ queryKey: ["screen", "production"] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not record production"); }
    finally { setBusy(false); }
  }}>
    <div className="mr-auto"><strong className="text-sm">{[line.name, line.color, line.size].filter(Boolean).join(" / ")}</strong><p className="text-xs text-muted-foreground">{line.completed} of {line.planned} pieces produced</p></div>
    <label className="text-xs">Pieces<input name="qty" type="number" required min={1} max={remaining} className="ml-2 w-24 rounded-md border px-2 py-1.5" /></label>
    <label className="text-xs">Reference<input name="reason" required maxLength={400} className="ml-2 rounded-md border px-2 py-1.5" /></label>
    <Button type="submit" size="sm" disabled={!ready || !canWrite || busy || batch.status === "Cancelled"}>Record produced</Button>
    {!ready && <p className="w-full text-xs text-amber-700">Complete this style’s production timeline first.</p>}
    {error && <p role="alert" className="w-full text-xs text-destructive">{error}</p>}
  </form>;
}

export function BatchProductionDetail({ batchId, orderId }: { batchId: string; orderId: string }) {
  const client = useQueryClient();
  const { canWrite, reason: writeReason } = useModuleAccess("production");
  const { data, error } = useQuery({
    queryKey: ["batches", "production", orderId],
    queryFn: () => apiGet<Data>(`/batches/orders/${orderId}?kind=production`),
    refetchInterval: 30000,
  });
  const { data: parentDetail } = useQuery({
    queryKey: ["production", "porder", orderId],
    queryFn: () => apiGet<{ materials: { component: string; material: string; qty: string; cost: string }[] }>(`/production/porders/${orderId}/detail`),
  });
  const batch = data?.batches.find((entry) => entry.publicId === batchId);
  const [startStyle, setStartStyle] = React.useState<{ id: number; lineId: string; names: string[] } | null>(null);
  const [modal, setModal] = React.useState<{ kind: "assign" | "notes" | "extend"; id: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState("");
  const act = async (id: string, action: string, body: Record<string, unknown> = {}) => {
    setBusy(true); setActionError("");
    try {
      await apiPost(`/batches/${batchId}/stages/${id}/action/${action}`, {
        ...body, reason: String(body.notes || `Production stage ${action}`), requestId: crypto.randomUUID(),
      });
      await client.invalidateQueries({ queryKey: ["batches"] });
      await client.invalidateQueries({ queryKey: ["screen", "production"] });
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not update the stage"); }
    finally { setBusy(false); }
  };
  const fields: FinanceField[] = modal?.kind === "assign" ? [{ name: "worker", label: "Worker", required: true }]
    : modal?.kind === "notes" ? [{ name: "notes", label: "Notes", required: false }]
    : [{ name: "days", label: "Extra days", type: "number", required: true }];

  const styleGroups = new Map<number, Line[]>();
  for (const line of batch?.lines || []) {
    const id = line.productionLineId ?? -line.id;
    styleGroups.set(id, [...(styleGroups.get(id) || []), line]);
  }
  const styles = [...styleGroups];
  return <div className="mx-auto w-full max-w-[1180px] space-y-4">
    <Link className="text-sm font-semibold text-primary hover:underline" href={`/production/porders/${orderId}`}>← Back to {batch?.orderRef || "production order"}</Link>
    {error && <p role="alert" className="text-destructive">{String(error)}</p>}
    {!data && !error && <p>Loading production suborder…</p>}
    {data && !batch && <p role="alert">This batch does not belong to the production order.</p>}
    {batch && <>
      <Card className="p-6"><div className="text-xs font-bold uppercase text-muted-foreground">{batch.orderRef} / production suborder</div>
        <h1 className="mt-1 text-2xl font-extrabold">{batch.name}</h1>
        <p className="mt-2 text-sm">{batch.summary.planned} planned · {batch.summary.completed} produced · {batch.productionStatus}</p>
        <p className="mt-1 text-xs text-muted-foreground">Factory: {batch.factory || "Unassigned"} · Target: {batch.dueOn || "Not set"}</p>
      </Card>
      {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
      <Tabs defaultValue="summary">
        <TabsList className="erp-scroll mb-4 w-full justify-start overflow-x-auto border-b">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          {styles.map(([styleId, variants]) => <TabsTrigger key={styleId} value={`style-${styleId}`}>{variants[0].name}</TabsTrigger>)}
          <TabsTrigger value="materials">Bill of materials</TabsTrigger>
        </TabsList>
        <TabsContent value="summary"><Card className="p-6"><h2 className="mb-4 font-bold">Batch line items</h2>
          <ResponsiveTable className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-muted-foreground"><th className="pb-2">Item</th><th className="pb-2">Colour</th><th className="pb-2">Size</th><th className="pb-2 text-right">Planned</th><th className="pb-2 text-right">Produced</th></tr></thead>
            <tbody>{batch.lines.map((line) => <tr key={line.id} className="border-t"><td className="py-2 font-semibold">{line.name}</td><td>{line.color || "—"}</td><td>{line.size || "—"}</td><td className="text-right">{line.planned}</td><td className="text-right">{line.completed}</td></tr>)}</tbody>
          </ResponsiveTable></Card></TabsContent>
      {styles.map(([styleId, variants]) => {
        const styleStages = batch.stages.filter((stage) => stage.productionLineId === styleId);
        const state = timeline(styleStages);
        const style: LineTL = {
          publicId: variants[0].productionLinePublicId || "", name: variants[0].name,
          qty: variants.reduce((sum, line) => sum + line.planned, 0), ...state,
        };
        return <TabsContent key={styleId} value={`style-${styleId}`} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{style.name}</h2><span className="text-sm">{style.qty} pieces · {style.progress}% stages complete</span></div>
          <LineTimeline line={style} busy={busy} onAct={(id, action, body) => { void act(id, action, body); }}
            onModal={setModal} onStart={() => setStartStyle({ id: styleId, lineId: style.publicId, names: styleStages.map((stage) => stage.name) })}
            canWrite={canWrite && batch.status !== "Cancelled" && styleId > 0} writeReason={writeReason} />
          <div className="space-y-2"><h3 className="text-sm font-bold">Produced quantities</h3>
            {variants.map((line) => <ProducedQuantity key={line.id} batch={batch} line={line} ready={line.tnaComplete} />)}
          </div>
        </TabsContent>;
      })}
        <TabsContent value="materials"><Card className="p-6"><h2 className="mb-4 font-bold">Bill of materials</h2>
          <ResponsiveTable className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-muted-foreground"><th className="pb-2">Component</th><th className="pb-2">Material</th><th className="pb-2 text-right">Qty / unit</th><th className="pb-2 text-right">Cost</th></tr></thead>
            <tbody>{parentDetail?.materials.map((material, index) => <tr key={index} className="border-t"><td className="py-2 font-semibold">{material.component}</td><td>{material.material}</td><td className="text-right">{material.qty}</td><td className="text-right">{material.cost}</td></tr>)}</tbody>
          </ResponsiveTable>{!parentDetail?.materials.length && <p className="py-6 text-center text-sm text-muted-foreground">No bill of materials linked.</p>}
        </Card></TabsContent>
      </Tabs>
    </>}
    <ProductionStartModal open={!!startStyle} onOpenChange={(open) => { if (!open) setStartStyle(null); }}
      orderId={orderId} batchId={batchId} productionLineId={startStyle?.id}
      lineId={startStyle?.lineId} stageNames={startStyle?.names}
      onStarted={() => { setStartStyle(null); void client.invalidateQueries({ queryKey: ["batches"] }); }} />
    <FinanceFormSheet open={!!modal} onOpenChange={(open) => { if (!open) setModal(null); }}
      title={modal?.kind === "assign" ? "Assign worker" : modal?.kind === "notes" ? "Stage notes" : "Extend stage"}
      submitLabel="Save" fields={fields} onSubmit={(values) => {
        if (!modal) return;
        void act(modal.id, modal.kind, modal.kind === "extend" ? { days: Number(values.days) }
          : modal.kind === "assign" ? { worker: values.worker } : { notes: values.notes });
        setModal(null);
      }} />
  </div>;
}
