"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, ChevronDown, ChevronUp, User, Clock, Info, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiHeader } from "@/components/screens/ai/ai-header";
import { AiLoading, AiError } from "@/components/screens/ai/ai-shared";
import { useAi } from "@/lib/ai-context";
import {
  fetchAiValidation, fetchAiAudit, fetchAiForecastAccuracy, revertAiOverride, revertAllAiOverrides,
} from "@/lib/ai-api";
import type { ValidationData, AuditEntry, ForecastAccuracyData, Scenario } from "@/lib/ai-types";

const SCEN: Scenario[] = ["conservative", "base", "optimistic"];
const SCEN_LABEL: Record<Scenario, string> = { conservative: "Conservative", base: "Base case", optimistic: "Optimistic" };
const eur = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export function AiValidation() {
  const { scenario } = useAi();
  const qc = useQueryClient();

  const validation = useQuery<ValidationData>({ queryKey: ["ai", "validation", scenario], queryFn: () => fetchAiValidation(scenario) });
  const audit = useQuery<AuditEntry[]>({ queryKey: ["ai", "audit"], queryFn: () => fetchAiAudit(30) });
  const accuracy = useQuery<ForecastAccuracyData | null>({ queryKey: ["ai", "accuracy"], queryFn: () => fetchAiForecastAccuracy().catch(() => null) });

  const [auditOpen, setAuditOpen] = React.useState(false);
  const [reverting, setReverting] = React.useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ai", "validation"] });
    qc.invalidateQueries({ queryKey: ["ai", "audit"] });
  };

  const revertOne = async (o: ValidationData["overrides"][number]) => {
    const key = `${o.reference}|${o.couleur}|${o.taille}`;
    setReverting(key);
    try { await revertAiOverride(o.reference, o.couleur, o.taille); invalidate(); }
    finally { setReverting(null); }
  };
  const revertAll = async () => {
    setReverting("__all__");
    try { await revertAllAiOverrides(); invalidate(); }
    finally { setReverting(null); }
  };

  const metrics = validation.data?.scenarioMetrics ?? {};
  const overrides = validation.data?.overrides ?? [];

  return (
    <div>
      <AiHeader
        title="Order validation"
        subtitle="Final scenario review before the order syncs through the ERP"
        showScenario
        onRefresh={() => { validation.refetch(); audit.refetch(); accuracy.refetch(); }}
      />

      {validation.isError ? (
        <AiError message="Couldn't load validation data" />
      ) : validation.isLoading ? (
        <AiLoading />
      ) : (
        <div className="space-y-4">
          {/* Scenario comparison */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-extrabold text-foreground">Scenario comparison</h3>
              <p className="text-[13px] text-muted-foreground">Compare metrics across scenarios before validating</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 text-left font-bold">Metric</th>
                    {SCEN.map((s) => (
                      <th key={s} className={cn("px-5 py-3 text-center font-bold", scenario === s && "bg-brand-orange/10 text-brand-orange")}>
                        {SCEN_LABEL[s]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Total units", key: "totalUnits", fmt: (v: number) => v.toLocaleString() },
                    { label: "Purchase cost", key: "purchaseCost", fmt: eur },
                    { label: "Budget usage", key: "budgetUsage", fmt: (v: number) => `${v}%` },
                    { label: "Gross margin", key: "grossMargin", fmt: (v: number) => `${v}%` },
                    { label: "SKUs at risk", key: "skusAtRisk", fmt: (v: number) => String(v) },
                  ].map((row) => (
                    <tr key={row.key} className="border-t border-border/50">
                      <td className="px-5 py-3 font-semibold text-foreground">{row.label}</td>
                      {SCEN.map((s) => {
                        const m = metrics[s] as Record<string, number> | undefined;
                        return (
                          <td key={s} className={cn("px-5 py-3 text-center tabular", scenario === s ? "bg-brand-orange/10 font-bold text-foreground" : "text-muted-foreground")}>
                            {row.fmt((m?.[row.key] as number) ?? 0)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Override summary */}
          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-extrabold text-foreground">Override summary</h3>
                <p className="text-[13px] text-muted-foreground">{overrides.length} SKUs with manual adjustments</p>
              </div>
              {overrides.length > 0 && (
                <Button variant="outline" size="sm" onClick={revertAll} disabled={reverting !== null}>
                  <RotateCcw size={14} /> Revert all
                </Button>
              )}
            </div>
            <div className="divide-y divide-border/50 overflow-hidden rounded-lg border border-border">
              {overrides.map((o) => {
                const key = `${o.reference}|${o.couleur}|${o.taille}`;
                const up = o.userOverride > o.aiRecommended;
                return (
                  <div key={key} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{o.skuId}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{o.reasonTag}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground">{o.skuName}</p>
                      {o.notes && <p className="mt-0.5 text-[11px] text-muted-foreground">{o.notes}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-6 text-[13px]">
                      <Metric label="Engine" value={String(o.aiRecommended)} />
                      <Metric label="Override" value={String(o.userOverride)} tone={up ? "up" : "down"} />
                      <Metric label="Diff" value={`${up ? "+" : ""}${o.userOverride - o.aiRecommended}`} tone={up ? "up" : "down"} />
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[#C0392B]"
                        onClick={() => revertOne(o)} disabled={reverting !== null} title="Revert to engine recommendation"
                      >
                        <RotateCcw size={15} className={cn(reverting === key && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {overrides.length === 0 && <div className="py-8 text-center text-[13px] text-muted-foreground">No manual overrides this scenario.</div>}
            </div>
          </Card>

          {/* Forecast accuracy */}
          <Card className="p-5">
            <h3 className="text-[15px] font-extrabold text-foreground">Forecast accuracy (backtest)</h3>
            <p className="text-[13px] text-muted-foreground">Walk-forward out-of-sample error: WMAPE, bias, 80% interval coverage</p>
            {accuracy.isLoading ? (
              <AiLoading label="Loading accuracy…" />
            ) : !accuracy.data?.headline?.lastRunAt ? (
              <p className="mt-4 text-[13px] text-muted-foreground">No backtest results yet.</p>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Kpi label="WMAPE" value={accuracy.data.headline.wmape != null ? `${accuracy.data.headline.wmape.toFixed(1)}%` : "—"} />
                  <Kpi label="Bias" value={accuracy.data.headline.bias != null ? `${accuracy.data.headline.bias > 0 ? "+" : ""}${accuracy.data.headline.bias.toFixed(1)}%` : "—"} sub="+ = over-forecast" />
                  <Kpi label="80% coverage" value={accuracy.data.headline.coverage80 != null ? `${accuracy.data.headline.coverage80.toFixed(1)}%` : "—"} />
                  <Kpi label="SKU-months" value={String(accuracy.data.headline.skuCount)} sub={new Date(accuracy.data.headline.lastRunAt).toLocaleDateString()} />
                </div>
                {accuracy.data.trend.length > 0 && (
                  <div>
                    <p className="mb-2 text-[12px] font-semibold text-foreground">WMAPE trend by fold</p>
                    <div className="flex h-28 items-end gap-1.5">
                      {accuracy.data.trend.map((t) => {
                        const max = Math.max(1, ...accuracy.data!.trend.map((x) => x.wmape ?? 0));
                        return (
                          <div key={t.foldMonth} className="flex flex-1 flex-col items-center gap-1">
                            <div className="w-full rounded-t bg-brand-orange" style={{ height: `${((t.wmape ?? 0) / max) * 100}%`, minHeight: 2 }} title={`${t.wmape?.toFixed(1)}%`} />
                            <span className="truncate text-[9px] text-muted-foreground">{t.foldMonth}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <AccuracyTable title="By model type" cols={["Model", "WMAPE", "Bias", "Cov."]} rows={accuracy.data.byModelType.map((r) => [r.modelType, pct(r.wmape), pct(r.bias), pct(r.coverage80)])} />
                  <AccuracyTable title="By category" cols={["Famille", "WMAPE", "Bias", "Cov."]} rows={accuracy.data.byCategory.map((r) => [r.famille, pct(r.wmape), pct(r.bias), pct(r.coverage80)])} />
                </div>
              </div>
            )}
          </Card>

          {/* Audit trail */}
          <Card className="p-5">
            <button onClick={() => setAuditOpen((o) => !o)} className="flex w-full items-center justify-between">
              <div className="text-left">
                <h3 className="text-[15px] font-extrabold text-foreground">Decision audit trail</h3>
                <p className="text-[13px] text-muted-foreground">Full log of changes to the recommendations</p>
              </div>
              {auditOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>
            {auditOpen && (
              <div className="erp-scroll mt-4 max-h-[320px] space-y-3 overflow-y-auto">
                {(audit.data ?? []).map((e) => (
                  <div key={e.id} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background"><User size={14} className="text-muted-foreground" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{e.user}</span>
                        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{e.action}</span>
                        <span className="text-[13px] text-muted-foreground">{e.entity_id}</span>
                      </div>
                      {e.previous_value != null && e.new_value != null && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">Changed {e.previous_value} → {e.new_value}</p>
                      )}
                      {e.details && <p className="mt-0.5 text-[11px] text-muted-foreground">{e.details}</p>}
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Clock size={11} /> {timeAgo(e.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {(audit.data ?? []).length === 0 && <p className="py-4 text-center text-[13px] text-muted-foreground">No activity logged.</p>}
              </div>
            )}
          </Card>

          {/* Sync note (ERP owns the sync) */}
          <Card className="flex items-center gap-3 border-brand-orange/30 bg-brand-orange/5 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange"><CheckCircle2 size={20} /></span>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-foreground">Validated orders flow into the ERP automatically</p>
              <p className="text-[13px] text-muted-foreground">Once you finalize the {SCEN_LABEL[scenario].toLowerCase()} scenario, the ERP picks up the order — no separate export needed.</p>
            </div>
            <Info size={16} className="text-muted-foreground" />
          </Card>
        </div>
      )}
    </div>
  );
}

const pct = (v: number | null) => (v != null ? `${v.toFixed(1)}%` : "—");

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="text-right">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("font-semibold", tone === "up" ? "text-[#1F7A53]" : tone === "down" ? "text-[#9C6B0E]" : "text-foreground")}>{value}</p>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AccuracyTable({ title, cols, rows }: { title: string; cols: string[]; rows: (string | number)[][] }) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold text-foreground">{title}</p>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-muted/40">
            <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {cols.map((c, i) => <th key={c} className={cn("px-3 py-2", i === 0 ? "text-left" : "text-right", "font-bold")}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border/50">
                {r.map((cell, j) => <td key={j} className={cn("px-3 py-2", j === 0 ? "text-left font-medium text-foreground" : "text-right tabular text-muted-foreground")}>{cell}</td>)}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={cols.length} className="py-4 text-center text-muted-foreground">No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
