"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Lock, Unlock, Save, Grid3x3, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AiHeader } from "@/components/screens/ai/ai-header";
import {
  ConfidenceBadge, DemandSplitBar, ExplainabilityPanel, FinancialImpactCard,
  StatusPill, AiLoading, AiError, SELECT_CLS,
} from "@/components/screens/ai/ai-shared";
import { useAi } from "@/lib/ai-context";
import { useModuleAccess } from "@/lib/module-access";
import {
  fetchAiRecommendations, updateAiRecommendation, lockAiRecommendation, unlockAiRecommendation,
} from "@/lib/ai-api";
import type { RecommendationRow, SizeBreakdownRow } from "@/lib/ai-types";

function refCouleur(r: RecommendationRow): [string, string] {
  if (r.reference) return [r.reference, r.couleur ?? ""];
  const [ref, col = ""] = r.skuId.split("|");
  return [ref, col];
}

export function AiRecommendations() {
  const { scenario } = useAi();
  const { canWrite, reason: writeReason } = useModuleAccess("ai");
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<RecommendationRow[]>({
    queryKey: ["ai", "recommendations", scenario],
    queryFn: () => fetchAiRecommendations({ scenario }),
  });

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [editedQty, setEditedQty] = React.useState<number | null>(null);
  const [sizeEditorOpen, setSizeEditorOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const recs = data ?? [];
  const selected = recs.find((r) => r.skuId === selectedId) ?? null;

  React.useEffect(() => {
    if (!selectedId && recs.length) setSelectedId(recs[0].skuId);
  }, [recs, selectedId]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return recs.filter((r) => {
      if (q && !r.skuId.toLowerCase().includes(q) && !r.skuName.toLowerCase().includes(q)) return false;
      if (status !== "all" && r.status !== status) return false;
      if (category !== "all" && r.category !== category) return false;
      return true;
    }).slice(0, 150);
  }, [recs, search, status, category]);

  const categories = React.useMemo(() => Array.from(new Set(recs.map((r) => r.category))).filter(Boolean), [recs]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ai", "recommendations"] });

  const toggleLock = async (r: RecommendationRow) => {
    const [ref, col] = refCouleur(r);
    setBusy(true);
    try {
      r.locked ? await unlockAiRecommendation(ref, col) : await lockAiRecommendation(ref, col);
      await invalidate();
    } finally { setBusy(false); }
  };

  const saveTotal = async () => {
    if (!selected || editedQty === null) return;
    const [ref, col] = refCouleur(selected);
    const sizes = selected.sizeBreakdown ?? [];
    const currentSum = sizes.reduce((s, x) => s + (x.finalQty ?? x.recommended ?? 0), 0);
    let allocated = 0;
    const newSizes = sizes.map((s) => {
      const base = currentSum > 0 ? (s.finalQty ?? s.recommended ?? 0) : 1;
      const denom = currentSum > 0 ? currentSum : sizes.length;
      const q = Math.max(0, Math.round((base / denom) * editedQty));
      allocated += q;
      return { size: s.size, finalQty: q };
    });
    if (newSizes.length) newSizes[newSizes.length - 1].finalQty += editedQty - allocated;
    setBusy(true);
    try {
      await updateAiRecommendation(ref, col, { sizeBreakdown: newSizes, reason: "manual_total_edit" });
      setEditedQty(null);
      await invalidate();
    } finally { setBusy(false); }
  };

  const applySizes = async (sizes: SizeBreakdownRow[]) => {
    if (!selected) return;
    const [ref, col] = refCouleur(selected);
    setBusy(true);
    try {
      await updateAiRecommendation(ref, col, {
        sizeBreakdown: sizes.map((s) => ({ size: s.size, finalQty: s.finalQty })),
        reason: "size_rules",
      });
      setSizeEditorOpen(false);
      setEditedQty(null);
      await invalidate();
    } finally { setBusy(false); }
  };

  return (
    <div>
      <AiHeader
        title="SKU recommendations"
        subtitle="Review, adjust and lock the engine's order recommendations"
        showScenario
        onRefresh={() => refetch()}
      />

      {isError ? (
        <AiError message="Couldn't load recommendations" />
      ) : isLoading ? (
        <AiLoading />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          {/* List */}
          <Card className="flex max-h-[calc(100vh-220px)] flex-col p-4">
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
              <Input placeholder="Search SKUs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="mb-3 flex gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={cn(SELECT_CLS, "flex-1")}>
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="adjusted">Adjusted</option>
                <option value="locked">Locked</option>
                <option value="validated">Validated</option>
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(SELECT_CLS, "flex-1")}>
                <option value="all">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="erp-scroll -mx-1 flex-1 space-y-2 overflow-y-auto px-1">
              {filtered.map((r) => {
                const [ref, col] = refCouleur(r);
                return (
                  <button
                    key={r.skuId}
                    onClick={() => { setSelectedId(r.skuId); setEditedQty(null); }}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-all",
                      selectedId === r.skuId ? "border-brand-orange bg-brand-orange/5" : "border-border hover:border-muted-foreground/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-semibold text-foreground">{ref}</span>
                          {r.locked && <Lock size={12} className="shrink-0 text-brand-orange" />}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">{col}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{r.category}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular text-[13px] font-bold text-foreground">{r.scenarios[scenario].total.toLocaleString()}</p>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          <ConfidenceBadge level={r.confidence} size="sm" showLabel={false} />
                          <StatusPill status={r.status} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="py-8 text-center text-[13px] text-muted-foreground">No SKUs match filters.</p>}
            </div>
          </Card>

          {/* Detail */}
          {selected ? (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[20px] font-extrabold text-foreground">{refCouleur(selected)[0]}</h2>
                      <StatusPill status={selected.status} />
                      {selected.locked && <StatusPill status="locked" />}
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground">{selected.skuName} — {selected.category}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleLock(selected)} disabled={busy || !canWrite}
                    title={!canWrite ? writeReason ?? undefined : undefined}>
                    {selected.locked ? <><Unlock size={15} /> Unlock</> : <><Lock size={15} /> Lock</>}
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 text-[15px] font-extrabold text-foreground">Demand breakdown</h3>
                <DemandSplitBar
                  confirmed={selected.scenarios[scenario].confirmed}
                  probableReorders={selected.scenarios[scenario].probableReorders}
                  nonVisitedProjection={selected.scenarios[scenario].nonVisitedProjection}
                  height="lg"
                  showLabels
                />
                <p className="mt-4 text-[16px] font-bold text-foreground">
                  Total recommended: {selected.scenarios[scenario].total.toLocaleString()} units
                </p>
              </Card>

              <Card className={cn("p-5", selected.locked && "opacity-60")}>
                <h3 className="mb-3 text-[15px] font-extrabold text-foreground">Quantity adjustment</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label className="text-[12px] text-muted-foreground">Total quantity</Label>
                    <Input
                      type="number"
                      className="mt-1 text-[16px] font-semibold"
                      value={editedQty ?? selected.scenarios[scenario].total}
                      disabled={selected.locked}
                      onChange={(e) => setEditedQty(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => setSizeEditorOpen(true)} disabled={selected.locked || !canWrite}
                    title={!canWrite ? writeReason ?? undefined : undefined}>
                    <Grid3x3 size={15} /> Edit sizes
                  </Button>
                  <Button onClick={saveTotal} disabled={selected.locked || editedQty === null || busy || !canWrite}
                    title={!canWrite ? writeReason ?? undefined : undefined}>
                    <Save size={15} /> Save
                  </Button>
                </div>
                {editedQty !== null && editedQty !== selected.scenarios[scenario].total && (
                  <div className="mt-3 flex items-center gap-2">
                    <StatusPill status="adjusted" />
                    <button onClick={() => setEditedQty(null)} className="text-[12px] font-semibold text-brand-orange hover:underline">
                      Reset to engine recommendation
                    </button>
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 text-[15px] font-extrabold text-foreground">Size breakdown</h3>
                <div className="flex h-28 items-end gap-2">
                  {selected.sizeBreakdown.map((s) => {
                    const max = Math.max(1, ...selected.sizeBreakdown.map((x) => x.finalQty));
                    return (
                      <div key={s.size} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className={cn("w-full rounded-t", s.blocked ? "bg-muted-foreground/40" : s.manualOverride !== null ? "bg-[#D29A22]" : "bg-brand-orange")}
                          style={{ height: `${(s.finalQty / max) * 100}%`, minHeight: s.finalQty > 0 ? 6 : 0 }}
                        />
                        <span className="text-[11px] font-semibold">{s.size}</span>
                        <span className="text-[10px] text-muted-foreground">{s.finalQty}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <ExplainabilityPanel
                data={selected.explainability}
                totalUnits={editedQty ?? selected.scenarios[scenario].total}
                skuName={selected.skuName}
                defaultExpanded
              />
              <FinancialImpactCard impact={selected.financialImpact} />
            </div>
          ) : (
            <Card className="flex h-96 items-center justify-center">
              <p className="text-[13px] text-muted-foreground">Select a SKU to view its recommendation.</p>
            </Card>
          )}
        </div>
      )}

      {selected && (
        <SizeEditorModal
          open={sizeEditorOpen}
          onOpenChange={setSizeEditorOpen}
          skuId={refCouleur(selected)[0]}
          skuName={selected.skuName}
          sizes={selected.sizeBreakdown}
          onApply={applySizes}
          busy={busy}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Size editor — per-size manual overrides that POST back to the engine.
// ---------------------------------------------------------------------------
function SizeEditorModal({
  open, onOpenChange, skuId, skuName, sizes, onApply, busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  skuId: string;
  skuName: string;
  sizes: SizeBreakdownRow[];
  onApply: (sizes: SizeBreakdownRow[]) => void;
  busy: boolean;
}) {
  const [rows, setRows] = React.useState<SizeBreakdownRow[]>(sizes);
  React.useEffect(() => { if (open) setRows(sizes); }, [open, sizes]);

  const total = rows.reduce((s, r) => s + (r.finalQty || 0), 0);
  const setQty = (size: string, qty: number) =>
    setRows((prev) => prev.map((r) => r.size === size ? { ...r, finalQty: Math.max(0, qty), manualOverride: Math.max(0, qty) } : r));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit sizes — {skuId}</SheetTitle>
          <SheetDescription>{skuName}. Set the quantity per size; changes save to the engine.</SheetDescription>
        </SheetHeader>
        <div className="erp-scroll flex-1 space-y-3 overflow-y-auto px-6 pb-6">
          {rows.map((r) => (
            <div key={r.size} className="flex items-center justify-between gap-3">
              <Label htmlFor={`sz-${r.size}`} className="flex items-center gap-2">
                <span className="flex h-7 w-9 items-center justify-center rounded-md bg-muted text-[12px] font-bold text-muted-foreground">{r.size}</span>
                {r.blocked && <span className="text-[11px] font-semibold text-[#C0392B]">blocked</span>}
                {(r.minUnits != null || r.maxUnits != null) && (
                  <span className="text-[11px] text-muted-foreground">
                    {r.minUnits != null ? `min ${r.minUnits}` : ""}{r.minUnits != null && r.maxUnits != null ? " · " : ""}{r.maxUnits != null ? `max ${r.maxUnits}` : ""}
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">rec {r.recommended}</span>
                <Input
                  id={`sz-${r.size}`}
                  type="number"
                  min={0}
                  disabled={r.blocked}
                  className="w-24 text-right"
                  value={r.finalQty}
                  onChange={(e) => setQty(r.size, parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-[13px]">
            <span className="font-semibold text-muted-foreground">Total</span>
            <span className="font-extrabold text-foreground">{total.toLocaleString()} units</span>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
          <Button type="button" onClick={() => onApply(rows)} disabled={busy}>
            {busy ? "Saving…" : "Apply sizes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
