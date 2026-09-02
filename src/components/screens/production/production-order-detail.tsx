"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle2, Play, User, MessageSquare, Clock, AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/tone-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";
import { FinanceFormSheet, type FinanceField } from "@/components/screens/finance/finance-form-sheet";
import { ProductionStartModal } from "@/components/screens/production/production-start-modal";
import { useModuleAccess } from "@/lib/module-access";
import type { Tone } from "@/lib/tone";

interface Stage {
  public_id: string; seq: number; name: string; duration_days: number;
  status: string; overdue: boolean; start: string; end: string; worker: string; notes: string;
}
interface OrderLine {
  item: string; color: string; size: string; qty: number; price: string; total: string;
}
interface LineTL {
  publicId: string; name: string; qty: number; started: boolean; progress: number;
  statusLabel: string; statusTone: Tone;
  alert: { type: string; message: string } | null; stages: Stage[];
}
interface Detail {
  ref: string; title: string; statusLabel: string; statusTone: Tone;
  meta: { k: string; v: string }[];
  started: boolean; progress: number; stageNames: string[];
  canInspect?: boolean; inspected?: boolean;
  alert: { type: string; message: string } | null;
  stages: Stage[]; materials: { component: string; material: string; qty: string; cost: string }[];
  orderLines?: OrderLine[];
  orderTotal?: string;
  lines?: LineTL[];
}

const STATUS_TONE: Record<string, Tone> = {
  Completed: "green", "In Progress": "accent", Pending: "neutral",
};

const ALERT_STYLE: Record<string, { bg: string; fg: string }> = {
  overdue: { bg: "#FBEAEA", fg: "#C0392B" },
  due: { bg: "#FEF3E2", fg: "#B7791F" },
  waiting: { bg: "#FEF3E2", fg: "#B7791F" },
  progress: { bg: "#EEF2FB", fg: "#2563EB" },
  done: { bg: "#EAF7EF", fg: "#2E9E6B" },
};

const TAB_CLS =
  "mr-1 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3.5 pb-3 pt-0 text-[14px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground";

const stepColor = (s: Stage) =>
  s.status === "Completed" ? "#2E9E6B" : s.status === "In Progress" ? "#2563EB" : "#E3E5EA";

/** One style's production timeline (stepper + stage cards), or a start prompt. */
function LineTimeline({
  line, busy, onAct, onModal, onStart, canWrite, writeReason,
}: {
  line: LineTL;
  busy: boolean;
  onAct: (id: string, action: string, body?: Record<string, unknown>) => void;
  onModal: (m: { kind: "assign" | "notes" | "extend"; id: string }) => void;
  onStart: () => void;
  canWrite: boolean;
  writeReason?: string | null;
}) {
  if (!line.started) {
    return (
      <Card className="flex flex-col items-center gap-3 p-14 text-center">
        <div className="text-[15px] font-semibold text-foreground">Production hasn’t started</div>
        <p className="max-w-md text-[13px] text-muted-foreground">
          Start production to lay out the stage timeline (Trims → Lining → Cutting → Sewing →
          Finishing → Packed) for <span className="font-semibold">{line.name}</span>. Each item
          runs on its own timeline.
        </p>
        <Button variant="navy" size="sm" onClick={canWrite ? onStart : undefined}
          disabled={!canWrite} title={!canWrite ? writeReason ?? undefined : undefined}>
          <Play size={15} strokeWidth={2} /> Start production
        </Button>
      </Card>
    );
  }
  return (
    <>
      {line.alert && (
        <div
          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold"
          style={{
            background: (ALERT_STYLE[line.alert.type] ?? ALERT_STYLE.progress).bg,
            color: (ALERT_STYLE[line.alert.type] ?? ALERT_STYLE.progress).fg,
          }}
        >
          <AlertCircle size={16} strokeWidth={2} />
          {line.alert.message}
        </div>
      )}
      {/* Stepper */}
      <Card className="p-6">
        <div className="flex items-start">
          {line.stages.map((s, i) => (
            <React.Fragment key={s.public_id}>
              <div className="flex min-w-[80px] flex-col items-center text-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: stepColor(s) }}>
                  {s.status === "Completed" ? "✓" : s.seq}
                </span>
                <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground">{s.name}</span>
                <span className="text-[11px] text-muted-foreground">{s.duration_days} days</span>
                <span className="mt-1">
                  <ToneBadge tone={s.overdue ? "red" : STATUS_TONE[s.status] ?? "neutral"} dot={false}>
                    {s.overdue ? "Overdue" : s.status}
                  </ToneBadge>
                </span>
              </div>
              {i < line.stages.length - 1 && (
                <div className="mt-4 h-0.5 flex-1" style={{ background: s.status === "Completed" ? "#2E9E6B" : "#E3E5EA" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Stage cards */}
      <div className="mt-4 space-y-2.5">
        {line.stages.map((s) => (
          <Card key={s.public_id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-extrabold uppercase tracking-wide text-foreground">{s.name}</span>
                  <ToneBadge tone={STATUS_TONE[s.status] ?? "neutral"} dot={false}>{s.status}</ToneBadge>
                  {s.overdue && <ToneBadge tone="red" dot={false}>Overdue</ToneBadge>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-6 gap-y-0.5 text-[13px] font-bold text-foreground">
                  <span>Duration: {s.duration_days} days</span>
                  <span>Start: {s.start}</span>
                  <span>End: {s.end}</span>
                  <span>Worker: {s.worker}</span>
                </div>
                {s.notes && <div className="mt-1 text-[12px] font-bold italic text-foreground">“{s.notes}”</div>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {s.status === "In Progress" && (
                  <Button size="sm" className="h-8" disabled={busy || !canWrite}
                    title={!canWrite ? writeReason ?? undefined : undefined}
                    onClick={() => onAct(s.public_id, "complete")}>
                    <CheckCircle2 size={14} strokeWidth={2} /> Complete
                  </Button>
                )}
                {s.status === "Pending" && (
                  <Button size="sm" className="h-8" disabled={busy || !canWrite}
                    title={!canWrite ? writeReason ?? undefined : undefined}
                    onClick={() => onAct(s.public_id, "start")}>
                    <Play size={14} strokeWidth={2} /> Start
                  </Button>
                )}
                {s.status !== "Completed" && (
                  <>
                    <Button size="sm" variant="outline" className="h-8" disabled={!canWrite}
                      title={!canWrite ? writeReason ?? undefined : undefined}
                      onClick={() => onModal({ kind: "assign", id: s.public_id })}>
                      <User size={14} strokeWidth={2} /> Assign
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" disabled={!canWrite}
                      title={!canWrite ? writeReason ?? undefined : undefined}
                      onClick={() => onModal({ kind: "notes", id: s.public_id })}>
                      <MessageSquare size={14} strokeWidth={2} /> Notes
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" disabled={!canWrite}
                      title={!canWrite ? writeReason ?? undefined : undefined}
                      onClick={() => onModal({ kind: "extend", id: s.public_id })}>
                      <Clock size={14} strokeWidth={2} /> Extend
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" disabled={busy || !canWrite}
                      title={!canWrite ? writeReason ?? undefined : undefined}
                      onClick={() => onAct(s.public_id, "resolve")}>
                      <AlertCircle size={14} strokeWidth={2} /> Resolve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function ProductionOrderDetail({
  publicId, backHref,
}: {
  publicId: string;
  backHref: string;
}) {
  const qc = useQueryClient();
  const { canWrite, reason: writeReason } = useModuleAccess("production");
  const [startOpen, setStartOpen] = React.useState(false);
  // null → start the whole order (all lines); otherwise start just this line.
  const [startLineId, setStartLineId] = React.useState<string | null>(null);
  const [modal, setModal] = React.useState<{ kind: "assign" | "notes" | "extend"; id: string } | null>(null);

  const { data } = useQuery<Detail>({
    queryKey: ["production", "porder", publicId],
    queryFn: () => apiGet<Detail>(`/production/porders/${publicId}/detail`),
    enabled: USE_BACKEND,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["production", "porder", publicId] });

  const act = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: Record<string, unknown> }) =>
      apiPost(`/production/stages/${id}/${action}`, body ?? {}),
    onSuccess: refresh,
  });
  const onAct = (id: string, action: string, body?: Record<string, unknown>) =>
    act.mutate({ id, action, body });

  // Production complete → open a QC inspection (order flows to Quality).
  const inspect = useMutation({
    mutationFn: () => apiPost(`/production/porders/${publicId}/inspect`, {}),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ["screen", "quality", "inspections"] });
    },
  });

  const modalFields: FinanceField[] =
    modal?.kind === "assign" ? [{ name: "worker", label: "Worker", required: true }]
    : modal?.kind === "notes" ? [{ name: "notes", label: "Notes", required: false }]
    : [{ name: "days", label: "Extra days", type: "number", required: true }];

  const lines = data?.lines ?? [];

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={16} strokeWidth={2} /> Back to Orders
      </Link>

      {!data ? (
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      ) : (
        <>
          {/* Header */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9499A6]">{data.ref}</div>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">{data.title}</h1>
                  <ToneBadge tone={data.statusTone}>{data.statusLabel}</ToneBadge>
                </div>
              </div>
              {/* Production is started per item, from each item's tab below —
                  no order-level "Start production" here. */}
              {data.canInspect && (
                <Button variant="navy" size="sm" disabled={inspect.isPending || !canWrite}
                        title={!canWrite ? writeReason ?? undefined : undefined}
                        onClick={() => inspect.mutate()}>
                  <CheckCircle2 size={15} strokeWidth={2} />
                  {inspect.isPending ? "Sending…" : "Send for inspection"}
                </Button>
              )}
              {data.inspected && (
                <ToneBadge tone="navy" dot={false}>Sent for inspection</ToneBadge>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.meta.map((m) => (
                <div key={m.k} className="rounded-[12px] border border-border/70 bg-muted/40 px-4 py-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{m.k}</div>
                  <div className="mt-1 text-[18px] font-extrabold text-foreground">{m.v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Tabs defaultValue="summary" className="mt-4">
            <TabsList className="erp-scroll mb-4 w-full justify-start gap-0 overflow-x-auto border-b border-border/70">
              <TabsTrigger value="summary" className={TAB_CLS}>Summary</TabsTrigger>
              {lines.map((ln, i) => (
                <TabsTrigger key={i} value={`line-${i}`} className={TAB_CLS}>{ln.name}</TabsTrigger>
              ))}
              <TabsTrigger value="materials" className={TAB_CLS}>Bill of materials</TabsTrigger>
            </TabsList>

            {/* Summary — the complete order this work order fulfils. */}
            <TabsContent value="summary">
              <Card className="p-6">
                <div className="mb-4 text-base font-extrabold text-foreground">Order line items</div>
                {data.orderLines && data.orderLines.length > 0 ? (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="pb-2 text-left font-bold">Item</th>
                        <th className="pb-2 text-left font-bold">Size</th>
                        <th className="pb-2 text-right font-bold">Qty</th>
                        <th className="pb-2 text-right font-bold">Price</th>
                        <th className="pb-2 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orderLines.map((l, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="py-2.5 font-semibold text-foreground">
                            {l.item}{l.color ? ` · ${l.color}` : ""}
                          </td>
                          <td className="py-2.5 text-left uppercase">{l.size}</td>
                          <td className="py-2.5 text-right tabular">{l.qty}</td>
                          <td className="py-2.5 text-right tabular">{l.price}</td>
                          <td className="py-2.5 text-right tabular font-bold text-foreground">{l.total}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border font-extrabold text-foreground">
                        <td className="py-2.5" colSpan={4}>Total</td>
                        <td className="py-2.5 text-right tabular">{data.orderTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-[13px] text-muted-foreground">
                    No linked sales order — this is a standalone work order.
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* One timeline tab per style. */}
            {lines.map((ln, i) => (
              <TabsContent key={i} value={`line-${i}`}>
                <div className="mb-3 flex items-center gap-3 text-[13px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{ln.name}</span>
                  <span>· {ln.qty.toLocaleString()} units</span>
                  <ToneBadge tone={ln.statusTone} dot={false}>{ln.statusLabel} · {ln.progress}%</ToneBadge>
                </div>
                <LineTimeline
                  line={ln}
                  busy={act.isPending}
                  onAct={onAct}
                  onModal={setModal}
                  onStart={() => { setStartLineId(ln.publicId); setStartOpen(true); }}
                  canWrite={canWrite}
                  writeReason={writeReason}
                />
              </TabsContent>
            ))}

            <TabsContent value="materials">
              <Card className="p-6">
                <h3 className="mb-3 text-[17px] font-extrabold tracking-tight text-foreground">Bill of materials</h3>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 text-left font-bold">Component</th>
                      <th className="pb-2 text-left font-bold">Material</th>
                      <th className="pb-2 text-right font-bold">Qty / unit</th>
                      <th className="pb-2 text-right font-bold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.materials.map((m, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="py-2.5 font-semibold text-foreground">{m.component}</td>
                        <td className="py-2.5">{m.material}</td>
                        <td className="py-2.5 text-right tabular">{m.qty}</td>
                        <td className="py-2.5 text-right tabular font-bold text-foreground">{m.cost}</td>
                      </tr>
                    ))}
                    {data.materials.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No bill of materials linked.</td></tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      <ProductionStartModal
        open={startOpen}
        onOpenChange={setStartOpen}
        orderId={publicId}
        lineId={startLineId}
        stageNames={data?.stageNames}
        onStarted={() => { setStartOpen(false); refresh(); }}
      />

      <FinanceFormSheet
        open={!!modal}
        onOpenChange={(o) => { if (!o) setModal(null); }}
        title={modal?.kind === "assign" ? "Assign worker" : modal?.kind === "notes" ? "Stage notes" : "Extend stage"}
        submitLabel="Save"
        fields={modalFields}
        onSubmit={(v) => {
          if (!modal) return;
          const body = modal.kind === "extend" ? { days: v.days } : modal.kind === "assign" ? { worker: v.worker } : { notes: v.notes };
          act.mutate({ id: modal.id, action: modal.kind, body });
          setModal(null);
        }}
      />
    </div>
  );
}