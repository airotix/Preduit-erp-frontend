"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Confidence, Explainability } from "@/lib/ai-types";

/** Shared native-select styling matched to ERP inputs. */
export const SELECT_CLS =
  "h-9 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground outline-none focus:border-brand-orange";

// ---------------------------------------------------------------------------
// Confidence badge — high/medium/low → green/amber/red pill.
// ---------------------------------------------------------------------------
const CONF_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  high: { bg: "#EAF7EF", fg: "#1F7A53", label: "High" },
  medium: { bg: "#FBF3E6", fg: "#9C6B0E", label: "Medium" },
  low: { bg: "#FBEAEA", fg: "#C0392B", label: "Low" },
};

export function ConfidenceBadge({
  level,
  size = "md",
  showLabel = true,
}: {
  level: Confidence | string;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const s = CONF_STYLE[(level || "medium").toLowerCase()] ?? CONF_STYLE.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]"
      )}
      style={{ background: s.bg, color: s.fg }}
      title={`${s.label} confidence`}
    >
      <i className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {showLabel && s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Demand split bar — confirmed / probable reorders / non-visited projection.
// ---------------------------------------------------------------------------
export function DemandSplitBar({
  confirmed,
  probableReorders,
  nonVisitedProjection,
  height = "md",
  showLabels = false,
}: {
  confirmed: number;
  probableReorders: number;
  nonVisitedProjection: number;
  height?: "md" | "lg";
  showLabels?: boolean;
}) {
  const total = Math.max(1, confirmed + probableReorders + nonVisitedProjection);
  const seg = [
    { v: confirmed, color: "#2E9E6B", label: "Confirmed" },
    { v: probableReorders, color: "#EA6C18", label: "Probable reorders" },
    { v: nonVisitedProjection, color: "#A9AEBC", label: "Non-visited" },
  ];
  return (
    <div>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full bg-muted",
          height === "lg" ? "h-8" : "h-5"
        )}
      >
        {seg.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.v / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.v.toLocaleString()}`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
          {seg.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label} · <span className="font-semibold text-foreground">{s.v.toLocaleString()}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explainability panel — why the model recommends this quantity.
// ---------------------------------------------------------------------------
export function ExplainabilityPanel({
  data,
  totalUnits,
  skuName,
  defaultExpanded = false,
}: {
  data: Explainability;
  totalUnits: number;
  skuName?: string;
  defaultExpanded?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultExpanded);
  const rows = [
    {
      label: "Confirmed orders",
      units: data.confirmedOrders.units,
      detail: `${data.confirmedOrders.customerCount} customers`,
    },
    {
      label: "Probable reorders",
      units: data.probableReorders.units,
      detail: `${Math.round(data.probableReorders.reorderRate * 100)}% reorder rate · ${data.probableReorders.likelyCustomers} likely`,
    },
    {
      label: "Non-visited demand",
      units: data.nonVisitedDemand.units,
      detail: `${data.nonVisitedDemand.matchedCustomers} matched · ${data.nonVisitedDemand.clusterProfile}`,
    },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="flex items-center gap-2 text-[15px] font-extrabold text-foreground">
          <Sparkles size={16} className="text-brand-orange" /> Why this recommendation?
        </span>
        {open ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="space-y-4 px-5 pb-5">
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between text-[13px]">
                <div>
                  <span className="font-semibold text-foreground">{r.label}</span>
                  <span className="ml-2 text-muted-foreground">{r.detail}</span>
                </div>
                <span className="tabular font-bold text-foreground">{r.units.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-[12px] sm:grid-cols-4">
            <Signal label="Diffusion" value={`${Math.round(data.keySignals.diffusionRate * 100)}%`} />
            <Signal label="Depth/cust" value={data.keySignals.depthPerCustomer.toFixed(1)} />
            <Signal label="Cluster" value={data.keySignals.customerCluster} />
            <Signal label="Scenario ×" value={data.keySignals.scenarioMultiplier.toFixed(2)} />
          </div>
          {skuName && (
            <p className="text-[12px] text-muted-foreground">
              {skuName} · total recommended {totalUnits.toLocaleString()} units
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-bold text-foreground" title={value}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financial impact card.
// ---------------------------------------------------------------------------
export function FinancialImpactCard({
  impact,
}: {
  impact: {
    purchaseCost: number;
    expectedTurnover: number;
    grossMargin: number;
    marginPercent: number;
    budgetImpactPercent: number;
  };
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const items = [
    { label: "Purchase cost", value: fmt(impact.purchaseCost) },
    { label: "Expected turnover", value: fmt(impact.expectedTurnover) },
    { label: "Gross margin", value: fmt(impact.grossMargin) },
    { label: "Margin %", value: `${impact.marginPercent}%` },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-[15px] font-extrabold text-foreground">Financial impact</h3>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((i) => (
          <div key={i.label}>
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{i.label}</div>
            <div className="mt-0.5 text-[20px] font-extrabold tracking-tight text-foreground">{i.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border/60 pt-3 text-[12px] text-muted-foreground">
        Budget impact:{" "}
        <span className="font-bold text-foreground">{impact.budgetImpactPercent}%</span> of season budget
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks shared by AI screens.
// ---------------------------------------------------------------------------
export function AiLoading({ label = "Loading…" }: { label?: string }) {
  return <div className="py-20 text-center text-muted-foreground">{label}</div>;
}

export function AiError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#F1C9C9] bg-[#FBEAEA] p-4 text-[13px] font-semibold text-[#C0392B]">
      {message} — is the forecasting engine running and reachable at the configured AI API URL?
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    pending: { bg: "#EEF0F4", fg: "#5B6478" },
    adjusted: { bg: "#FBF3E6", fg: "#9C6B0E" },
    locked: { bg: "#FCEEE2", fg: "#C2511A" },
    validated: { bg: "#EAF7EF", fg: "#1F7A53" },
    new: { bg: "#E7EEFB", fg: "#2456B8" },
    "carry-over": { bg: "#FBF3E6", fg: "#9C6B0E" },
    core: { bg: "#EAF7EF", fg: "#1F7A53" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
      style={{ background: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}
