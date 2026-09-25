"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, ChevronDown, PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AiHeader } from "@/components/screens/ai/ai-header";
import { ConfidenceBadge, DemandSplitBar, AiLoading, AiError } from "@/components/screens/ai/ai-shared";
import { useAi } from "@/lib/ai-context";
import { fetchAiProjections, fetchAiProjectionDetail } from "@/lib/ai-api";
import type { ProjectionRow, ProjectionDetail, Confidence } from "@/lib/ai-types";

export function AiProjection() {
  const { scenario } = useAi();
  const { data, isLoading, isError, refetch } = useQuery<ProjectionRow[]>({
    queryKey: ["ai", "projections"],
    queryFn: () => fetchAiProjections(),
  });

  const [search, setSearch] = React.useState("");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [details, setDetails] = React.useState<Map<string, ProjectionDetail>>(new Map());

  const rows = React.useMemo(() => {
    const q = search.toLowerCase();
    return (data ?? []).filter((p) => p.skuId.toLowerCase().includes(q) || p.skuName.toLowerCase().includes(q)).slice(0, 150);
  }, [data, search]);

  const totals = React.useMemo(() => {
    return (data ?? []).reduce(
      (acc, p) => {
        const s = p.scenarios[scenario];
        return {
          confirmed: acc.confirmed + s.confirmed,
          reorders: acc.reorders + s.probableReorders,
          nonVisited: acc.nonVisited + s.nonVisitedProjection,
          total: acc.total + s.total,
        };
      },
      { confirmed: 0, reorders: 0, nonVisited: 0, total: 0 }
    );
  }, [data, scenario]);

  const confDist = React.useMemo(() => {
    const acc: Record<Confidence, number> = { high: 0, medium: 0, low: 0 };
    for (const p of data ?? []) if (acc[p.confidence] !== undefined) acc[p.confidence]++;
    return acc;
  }, [data]);

  const toggle = async (skuId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(skuId) ? next.delete(skuId) : next.add(skuId);
      return next;
    });
    if (!details.has(skuId)) {
      try {
        const d = await fetchAiProjectionDetail(skuId.replace("SKU-", ""));
        setDetails((prev) => new Map(prev).set(skuId, d));
      } catch { /* ignore */ }
    }
  };

  return (
    <div>
      <AiHeader
        title="Demand projection"
        subtitle="AI-powered demand forecasting across scenarios"
        showScenario
        onRefresh={() => refetch()}
      />

      {isError ? (
        <AiError message="Couldn't load projections" />
      ) : isLoading ? (
        <AiLoading />
      ) : (
        <div className="space-y-4">
          {/* Total demand */}
          <Card className="p-6">
            <h3 className="text-[15px] font-extrabold text-foreground">Total projected units</h3>
            <p className="text-[13px] text-muted-foreground">Breakdown by demand source · {scenario} scenario</p>
            <div className="mt-3 text-[38px] font-extrabold tracking-tight text-foreground">
              {totals.total.toLocaleString()}
              <span className="ml-2 text-[16px] font-medium text-muted-foreground">units</span>
            </div>
            <div className="mt-4">
              <DemandSplitBar confirmed={totals.confirmed} probableReorders={totals.reorders} nonVisitedProjection={totals.nonVisited} height="lg" showLabels />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
            {/* Table */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-[15px] font-extrabold text-foreground">Per-SKU projection</h3>
                <div className="relative w-56">
                  <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <Input placeholder="Search SKUs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[1fr_90px_90px_90px_90px_80px] gap-3 bg-muted/40 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <div>SKU</div>
                  <div className="text-right">Confirmed</div>
                  <div className="text-right">Reorders</div>
                  <div className="text-right">Projected</div>
                  <div className="text-right">Total</div>
                  <div className="text-center">Conf.</div>
                </div>
                {rows.map((p) => {
                  const s = p.scenarios[scenario];
                  const isOpen = expanded.has(p.skuId);
                  const d = details.get(p.skuId);
                  return (
                    <div key={p.skuId} className="border-t border-border/50">
                      <div
                        onClick={() => toggle(p.skuId)}
                        className={cn("grid cursor-pointer grid-cols-[1fr_90px_90px_90px_90px_80px] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40", isOpen && "bg-muted/40")}
                      >
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown size={15} className="shrink-0 text-muted-foreground" /> : <ChevronRight size={15} className="shrink-0 text-muted-foreground" />}
                          <div>
                            <p className="text-[13px] font-semibold text-foreground">{p.skuId}</p>
                            <p className="text-[11px] text-muted-foreground">{p.category}</p>
                          </div>
                        </div>
                        <div className="text-right text-[13px] font-semibold text-[#1F7A53]">{s.confirmed.toLocaleString()}</div>
                        <div className="text-right text-[13px] font-semibold text-brand-orange">{s.probableReorders.toLocaleString()}</div>
                        <div className="text-right text-[13px] font-semibold text-muted-foreground">{s.nonVisitedProjection.toLocaleString()}</div>
                        <div className="text-right text-[13px] font-extrabold text-foreground">{s.total.toLocaleString()}</div>
                        <div className="flex justify-center"><ConfidenceBadge level={p.confidence} size="sm" showLabel={false} /></div>
                      </div>
                      {isOpen && (
                        <div className="border-t border-border/50 bg-muted/20 p-4">
                          {d ? <StockMatrix detail={d} /> : <AiLoading label="Loading matrix…" />}
                        </div>
                      )}
                    </div>
                  );
                })}
                {rows.length === 0 && <div className="py-10 text-center text-[13px] text-muted-foreground">No SKUs match your search.</div>}
              </div>
            </Card>

            {/* Confidence distribution */}
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-foreground">
                  <PieChart size={15} /> Confidence distribution
                </h3>
                <div className="mt-4 space-y-3">
                  {(["high", "medium", "low"] as const).map((lvl) => {
                    const count = confDist[lvl];
                    const total = (data ?? []).length || 1;
                    const color = { high: "#2E9E6B", medium: "#D29A22", low: "#C0392B" }[lvl];
                    return (
                      <div key={lvl} className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 capitalize"><i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{lvl}</span>
                        <span className="font-semibold text-foreground">{count} <span className="text-muted-foreground">({Math.round((count / total) * 100)}%)</span></span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 border-t border-border/60 pt-3 text-[12px] text-muted-foreground">
                  Low-confidence SKUs are flagged for human review.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Color × size matrix from the engine's projection detail. */
function StockMatrix({ detail }: { detail: ProjectionDetail }) {
  const sizes = detail.sizeColumns ??
    Array.from(new Set(detail.colorVariants.flatMap((v) => Object.keys(v.forecastedQuantity))));
  const rowFor = (v: ProjectionDetail["colorVariants"][number]) =>
    sizes.map((s) => v.forecastedQuantity[s] ?? 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Forecasted", v: detail.stockSummary.forecastedQuantity },
          { l: "Supplier order", v: detail.stockSummary.supplierOrder },
          { l: "Stock", v: detail.stockSummary.stock },
          { l: "Total", v: detail.stockSummary.total },
        ].map((m) => (
          <div key={m.l} className="rounded-lg bg-background p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{m.l}</div>
            <div className="mt-0.5 text-[16px] font-extrabold text-foreground">{m.v.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 text-left font-bold">Color</th>
              {sizes.map((s) => <th key={s} className="px-2 py-2 text-right font-bold">{s}</th>)}
              <th className="px-3 py-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {detail.colorVariants.map((v) => {
              const cells = rowFor(v);
              const total = cells.reduce((a, b) => a + b, 0);
              return (
                <tr key={v.color} className="border-t border-border/50">
                  <td className="px-3 py-2 font-semibold text-foreground">{v.color}</td>
                  {cells.map((c, i) => <td key={i} className="px-2 py-2 text-right tabular text-muted-foreground">{c || "·"}</td>)}
                  <td className="px-3 py-2 text-right tabular font-bold text-foreground">{total.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
