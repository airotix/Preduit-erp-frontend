"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AiHeader } from "@/components/screens/ai/ai-header";
import { ConfidenceBadge, StatusPill, AiLoading, AiError, SELECT_CLS } from "@/components/screens/ai/ai-shared";
import { fetchAiProducts } from "@/lib/ai-api";
import type { ProductRow } from "@/lib/ai-types";
import { downloadCsv } from "@/lib/export-csv";

type SortField = "diffusionRate" | "reorderRate" | "totalUnitsSold" | "depthPerCustomer";

export function AiProductKpis() {
  const { data, isLoading, isError, refetch } = useQuery<ProductRow[]>({
    queryKey: ["ai", "products"],
    queryFn: () => fetchAiProducts(),
  });

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState<SortField>("diffusionRate");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<ProductRow | null>(null);

  const rows = React.useMemo(() => {
    const list = (data ?? [])
      .filter((p) => {
        if (search) {
          const q = search.toLowerCase();
          if (!p.skuId.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q)) return false;
        }
        if (category !== "all" && p.category !== category) return false;
        if (status !== "all" && (p.status || "core") !== status) return false;
        return true;
      })
      .sort((a, b) => ((a[sortBy] - b[sortBy]) * (sortOrder === "desc" ? -1 : 1)));
    return list;
  }, [data, search, category, status, sortBy, sortOrder]);

  const categories = React.useMemo(
    () => [...new Set((data ?? []).map((p) => p.category))].filter(Boolean),
    [data]
  );

  const sort = (f: SortField) => {
    if (sortBy === f) setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    else { setSortBy(f); setSortOrder("desc"); }
  };

  const exportCsv = () => {
    downloadCsv(
      "ai-product-kpis.csv",
      ["SKU", "Category", "Status", "Diffusion", "Depth/Cust", "Reorder", "Units Sold", "Customers", "Confidence"],
      rows.map((p) => [
        p.skuId, p.category, p.status || "core",
        (p.diffusionRate * 100).toFixed(1) + "%", p.depthPerCustomer.toFixed(1),
        (p.reorderRate * 100).toFixed(0) + "%", p.totalUnitsSold, p.buyingCustomers, p.aiConfidence,
      ])
    );
  };

  const Th = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => sort(field)}
      className={cn(
        "ml-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition-colors",
        sortBy === field ? "text-brand-orange" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <ArrowUpDown size={12} />
    </button>
  );

  return (
    <div>
      <AiHeader
        title="Product KPI explorer"
        subtitle="Diffusion, depth, reorder and demand signals across every SKU"
        onRefresh={() => refetch()}
        onExport={exportCsv}
      />

      {isError ? (
        <AiError message="Couldn't load product KPIs" />
      ) : isLoading ? (
        <AiLoading />
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={SELECT_CLS}>
                <option value="all">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLS}>
                <option value="all">All status</option>
                <option value="new">New</option>
                <option value="carry-over">Carry-over</option>
                <option value="core">Core</option>
              </select>
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-left font-bold">SKU</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3"><Th field="diffusionRate" label="Diffusion" /></th>
                    <th className="px-4 py-3"><Th field="depthPerCustomer" label="Depth/cust" /></th>
                    <th className="px-4 py-3"><Th field="reorderRate" label="Reorder" /></th>
                    <th className="px-4 py-3"><Th field="totalUnitsSold" label="Units sold" /></th>
                    <th className="px-4 py-3 text-center font-bold">Customers</th>
                    <th className="px-4 py-3 text-center font-bold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.skuId}
                      onClick={() => setSelected(p)}
                      className="cursor-pointer border-t border-border/50 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{p.skuId}</div>
                        <div className="text-[11px] text-muted-foreground">{p.category}</div>
                      </td>
                      <td className="px-4 py-3"><StatusPill status={p.status || "core"} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.min(100, p.diffusionRate * 100)}%` }} />
                          </div>
                          <span className="w-10 text-right tabular font-semibold">{(p.diffusionRate * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular font-semibold">{p.depthPerCustomer.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right tabular font-semibold">{(p.reorderRate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-right tabular font-semibold">{p.totalUnitsSold.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center tabular text-muted-foreground">{p.buyingCustomers}</td>
                      <td className="px-4 py-3"><div className="flex justify-center"><ConfidenceBadge level={p.aiConfidence} size="sm" showLabel={false} /></div></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No SKUs match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Drill-down */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.skuId}</SheetTitle>
                <SheetDescription>{selected.name} · {selected.category}</SheetDescription>
              </SheetHeader>
              <div className="erp-scroll flex-1 space-y-5 overflow-y-auto px-6 pb-6">
                <div className="flex items-center gap-2">
                  <StatusPill status={selected.status || "core"} />
                  <ConfidenceBadge level={selected.aiConfidence} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Diffusion rate", v: `${(selected.diffusionRate * 100).toFixed(1)}%` },
                    { l: "Depth / customer", v: selected.depthPerCustomer.toFixed(1) },
                    { l: "Reorder rate", v: `${(selected.reorderRate * 100).toFixed(0)}%` },
                    { l: "Total units sold", v: selected.totalUnitsSold.toLocaleString() },
                  ].map((m) => (
                    <div key={m.l} className="rounded-xl bg-muted/50 p-4">
                      <div className="text-[12px] text-muted-foreground">{m.l}</div>
                      <div className="mt-0.5 text-[22px] font-extrabold text-foreground">{m.v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="mb-3 text-[13px] font-bold text-foreground">Historical size breakdown</h4>
                  <div className="flex h-32 items-end gap-2 rounded-xl bg-muted/50 p-4">
                    {Object.entries(selected.sizeBreakdown).map(([size, qty]) => {
                      const max = Math.max(1, ...Object.values(selected.sizeBreakdown));
                      return (
                        <div key={size} className="flex flex-1 flex-col items-center gap-1">
                          <div className="w-full rounded-t bg-brand-orange" style={{ height: `${(qty / max) * 100}%`, minHeight: qty > 0 ? 4 : 0 }} />
                          <span className="text-[11px] font-semibold">{size}</span>
                          <span className="text-[10px] text-muted-foreground">{qty}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="text-[12px] text-muted-foreground">Buying customers</div>
                  <div className="mt-0.5 text-[22px] font-extrabold text-foreground">{selected.buyingCustomers}</div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
