"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, BarChart3, Users, CheckCircle2, XCircle, Eye, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AiHeader } from "@/components/screens/ai/ai-header";
import { ConfidenceBadge, AiLoading, AiError, SELECT_CLS } from "@/components/screens/ai/ai-shared";
import { fetchAiCustomers, fetchAiCustomerDetail } from "@/lib/ai-api";
import type { AiCustomer, CustomerTypology, PurchaseHistoryItem } from "@/lib/ai-types";

const TYPOLOGIES: CustomerTypology[] = ["independent", "chain", "key_account"];
const typologyLabel = (t: CustomerTypology) =>
  t === "key_account" ? "Key account" : t.charAt(0).toUpperCase() + t.slice(1);

export function AiCustomers() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ai", "customers"],
    queryFn: () => fetchAiCustomers(),
  });

  const [search, setSearch] = React.useState("");
  const [visited, setVisited] = React.useState("all");
  const [typology, setTypology] = React.useState("all");
  const [region, setRegion] = React.useState("all");
  const [view, setView] = React.useState<"geography" | "typology">("geography");
  const [selected, setSelected] = React.useState<AiCustomer | null>(null);

  const detail = useQuery({
    queryKey: ["ai", "customer-detail", selected?.id],
    queryFn: () => fetchAiCustomerDetail(selected!.id),
    enabled: !!selected,
  });

  const customers = data?.customers ?? [];

  const stats = React.useMemo(() => {
    const regions = Array.from(new Set(customers.map((c) => c.region))).sort();
    const visitedCount = customers.filter((c) => c.status === "visited").length;
    const coverage = customers.length ? Math.round((visitedCount / customers.length) * 100) : 0;
    const byRegion = new Map<string, { total: number; visited: number }>();
    const byType = new Map<string, { total: number; visited: number }>();
    for (const c of customers) {
      const rg = byRegion.get(c.region) ?? { total: 0, visited: 0 };
      rg.total++; if (c.status === "visited") rg.visited++; byRegion.set(c.region, rg);
      const ty = byType.get(c.typology) ?? { total: 0, visited: 0 };
      ty.total++; if (c.status === "visited") ty.visited++; byType.set(c.typology, ty);
    }
    return {
      regions,
      visitedCount,
      notVisitedCount: customers.length - visitedCount,
      coverage,
      geo: regions.map((r) => ({ region: r, ...(byRegion.get(r) ?? { total: 0, visited: 0 }) })),
      typ: TYPOLOGIES.map((t) => ({ typology: t, label: typologyLabel(t), ...(byType.get(t) ?? { total: 0, visited: 0 }) })),
    };
  }, [customers]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) => {
      if (q && !c.id.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      if (visited !== "all" && c.status !== visited) return false;
      if (typology !== "all" && c.typology !== typology) return false;
      if (region !== "all" && c.region !== region) return false;
      return true;
    });
  }, [customers, search, visited, typology, region]);

  return (
    <div>
      <AiHeader
        title="Customer coverage"
        subtitle="Visited customers and AI-matched profiles for the non-visited"
        onRefresh={() => refetch()}
      />

      {isError ? (
        <AiError message="Couldn't load customer coverage" />
      ) : isLoading ? (
        <AiLoading />
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Users} bg="#E7EEFB" fg="#2456B8" value={String(customers.length)} label="Total customers" />
            <StatCard icon={CheckCircle2} bg="#EAF7EF" fg="#1F7A53" value={String(stats.visitedCount)} label={`Visited (${stats.coverage}%)`} />
            <StatCard icon={XCircle} bg="#EEF0F4" fg="#5B6478" value={String(stats.notVisitedCount)} label={`Not visited (${100 - stats.coverage}%)`} />
            <StatCard icon={BarChart3} bg="#FCEEE2" fg="#C2511A" value={`${stats.coverage}%`} label="Coverage rate" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* Visualization */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-extrabold text-foreground">Coverage visualization</h3>
                <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  {(["geography", "typology"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold capitalize transition-colors",
                        view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v === "geography" ? <MapPin size={13} /> : <BarChart3 size={13} />} {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {(view === "geography" ? stats.geo : stats.typ).map((g) => {
                  const key = "region" in g ? g.region : g.label;
                  const pct = g.total ? (g.visited / g.total) * 100 : 0;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-foreground">{key}</span>
                        <span className="text-muted-foreground">{g.visited} / {g.total}</span>
                      </div>
                      <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="bg-[#2E9E6B]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 pt-2 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#2E9E6B]" /> Visited</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" /> Not visited</span>
                </div>
              </div>
            </Card>

            {/* Customer list */}
            <Card className="flex max-h-[540px] flex-col p-5">
              <h3 className="mb-3 text-[15px] font-extrabold text-foreground">Customer list</h3>
              <div className="relative mb-2">
                <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
                <Input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="mb-3 flex gap-2">
                <select value={visited} onChange={(e) => setVisited(e.target.value)} className={cn(SELECT_CLS, "flex-1")}>
                  <option value="all">All</option>
                  <option value="visited">Visited</option>
                  <option value="not_visited">Not visited</option>
                </select>
                <select value={typology} onChange={(e) => setTypology(e.target.value)} className={cn(SELECT_CLS, "flex-1")}>
                  <option value="all">All types</option>
                  {TYPOLOGIES.map((t) => <option key={t} value={t}>{typologyLabel(t)}</option>)}
                </select>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className={cn(SELECT_CLS, "flex-1")}>
                  <option value="all">All regions</option>
                  {stats.regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="erp-scroll -mx-1 flex-1 space-y-2 overflow-y-auto px-1">
                {filtered.slice(0, 60).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-foreground">{c.name}</span>
                        <span className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          c.status === "visited" ? "border-[#2E9E6B] text-[#1F7A53]" : "border-border text-muted-foreground"
                        )}>
                          {c.status === "visited" ? "Visited" : "Not visited"}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">{c.typology.replace("_", " ")} · {c.region}</p>
                      {c.status === "not_visited" && c.matchedTo && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <ArrowRight size={11} /> Matched to {c.matchedTo}
                          {c.matchConfidence && <ConfidenceBadge level={c.matchConfidence} size="sm" showLabel={false} />}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelected(c)}>
                      <Eye size={15} />
                    </Button>
                  </div>
                ))}
                {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-muted-foreground">No customers match filters.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Detail */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>ID: {selected.id}</SheetDescription>
              </SheetHeader>
              <div className="erp-scroll flex-1 space-y-5 overflow-y-auto px-6 pb-6">
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <Field label="Typology" value={selected.typology.replace("_", " ")} />
                  <Field label="Region" value={selected.region} />
                  <Field label="Status" value={selected.status === "visited" ? "Visited" : "Not visited"} />
                  <Field label="Avg. basket" value={`€${selected.avgBasket.toLocaleString()}`} />
                </div>
                <div>
                  <p className="mb-2 text-[12px] text-muted-foreground">Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.categories.map((cat) => (
                      <span key={cat} className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">{cat}</span>
                    ))}
                  </div>
                </div>
                {selected.status === "not_visited" && selected.matchedTo && (
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <h4 className="text-[13px] font-bold text-foreground">AI cluster matching</h4>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Matched to <strong className="text-foreground">{selected.matchedTo}</strong> with{" "}
                      {Math.round((selected.similarityScore ?? 0) * 100)}% similarity
                    </p>
                    {selected.matchConfidence && <div className="mt-2"><ConfidenceBadge level={selected.matchConfidence} /></div>}
                  </div>
                )}
                <div>
                  <h4 className="mb-3 text-[13px] font-bold text-foreground">Purchase history</h4>
                  {detail.isLoading ? (
                    <AiLoading label="Loading history…" />
                  ) : (detail.data?.purchaseHistory?.length ?? 0) > 0 ? (
                    <div className="space-y-2">
                      {detail.data!.purchaseHistory.slice(0, 20).map((item: PurchaseHistoryItem, i) => (
                        <div key={`${item.skuId}-${item.season}-${i}`} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-foreground">{item.skuId}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{item.skuName} · {item.season}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[13px] font-semibold text-foreground">{item.units} units</p>
                            <p className="text-[11px] text-muted-foreground">€{item.value.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-[13px] text-muted-foreground">No purchase history found.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ icon: Icon, bg, fg, value, label }: { icon: React.ElementType; bg: string; fg: string; value: string; label: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}>
          <Icon size={19} />
        </span>
        <div>
          <div className="text-[22px] font-extrabold tracking-tight text-foreground">{value}</div>
          <div className="text-[12px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}
