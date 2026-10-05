"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ToneBadge } from "@/components/tone-badge";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { useCurrency, money } from "@/lib/currency";
import { FinanceHeader } from "@/components/screens/finance/finance-header";
import { JournalEditor } from "@/components/screens/finance/journal-editor";
import { downloadCsv } from "@/lib/export-csv";
import { useModuleAccess } from "@/lib/module-access";
import type { Tone } from "@/lib/tone";

interface Kpi { value: number; sub: string; delta?: string; up?: boolean }
interface OverviewData {
  kpis: { cashBank: Kpi; ar: Kpi; ap: Kpi; revenue: Kpi };
  revCogs: { label: string; revenue: number; cogs: number }[];
  waterfall: { label: string; value: number; pct: number; tone: string }[];
  netMarginPct: number;
  effectiveTaxPct: number;
  recent: {
    date: string; entry: string; account: string; accountTone: Tone;
    memo: string; debit: number | null; credit: number | null;
  }[];
}

const WF_COLOR: Record<string, string> = {
  orange: "#EA6C18", purple: "#A855F7", green: "#2E9E6B",
};

export function FinanceOverview() {
  const { currency } = useCurrency();
  const { canWrite, reason: writeReason } = useModuleAccess("finance");
  const queryClient = useQueryClient();
  const [entryOpen, setEntryOpen] = React.useState(false);
  const { data, error, isError, refetch } = useQuery<OverviewData>({
    queryKey: ["finance", "overview", currency],
    queryFn: () => apiGet<OverviewData>(`/finance/overview?currency=${currency}`),
    enabled: USE_BACKEND,
  });

  const onPosted = () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
    setEntryOpen(false);
  };

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(
      "finance-recent-journal-entries.csv",
      ["Date", "Entry", "Account", "Memo", "Debit", "Credit"],
      data.recent.map((r) => [r.date, r.entry, r.account, r.memo, r.debit ?? "", r.credit ?? ""])
    );
  };

  const kpiCards = data && [
    { key: "cashBank", label: "Cash & bank", icon: Landmark, bg: "#FCEEE2", fg: "#EA6C18", d: data.kpis.cashBank },
    { key: "ar", label: "Accounts receivable", icon: ArrowDownLeft, bg: "#EAF7EF", fg: "#2E9E6B", d: data.kpis.ar },
    { key: "ap", label: "Accounts payable", icon: ArrowUpRight, bg: "#F3EEFB", fg: "#7C3AED", d: data.kpis.ap },
    { key: "revenue", label: "Revenue (YTD)", icon: TrendingUp, bg: "#FCEEE2", fg: "#EA6C18", d: data.kpis.revenue },
  ];

  const chartMax = data
    ? Math.max(1, ...data.revCogs.flatMap((r) => [r.revenue, r.cogs]))
    : 1;

  return (
    <div>
      <FinanceHeader
        title="Finance overview"
        subtitle="Consolidated position across ledgers, margin and cash"
        action="New entry"
        onAction={canWrite ? () => setEntryOpen(true) : undefined}
        actionDisabled={!canWrite}
        actionDisabledReason={writeReason ?? undefined}
        onExport={exportCsv}
      />

      <JournalEditor open={entryOpen} onOpenChange={setEntryOpen} onPosted={onPosted} />

      {isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-semibold text-destructive">Could not load finance overview</p>
          <p className="mt-2 text-sm">{error.message}</p>
          <button type="button" className="mt-3 min-h-11 rounded-lg border px-4 text-sm font-semibold" onClick={() => refetch()}>Retry</button>
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards!.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.key} className="p-5">
                  <div className="flex items-start justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: c.bg, color: c.fg }}
                    >
                      <Icon size={19} strokeWidth={2} />
                    </span>
                    {c.d.delta && (
                      <ToneBadge tone={c.d.up ? "green" : "red"} dot={false}>
                        {c.d.delta}
                      </ToneBadge>
                    )}
                  </div>
                  <div className="mt-4 text-[13px] font-semibold text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="mt-0.5 text-[26px] font-extrabold tracking-tight text-foreground">
                    {money(c.d.value, currency, true)}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{c.d.sub}</div>
                </Card>
              );
            })}
          </div>

          {/* Chart + waterfall */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[17px] font-extrabold tracking-tight text-foreground">
                    Revenue vs cost of goods sold
                  </h3>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    Trailing {data.revCogs.length} months · {currency}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[12px] font-semibold">
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "#F89438" }} /> Revenue</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: "#C084FC" }} /> COGS</span>
                </div>
              </div>
              <div className="mt-6 flex h-[240px] items-end justify-around gap-2">
                {data.revCogs.map((r) => (
                  <div key={r.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-[210px] w-full items-end justify-center gap-1.5">
                      <div className="w-1/2 max-w-[34px] rounded-t-md" style={{ height: `${(r.revenue / chartMax) * 100}%`, background: "#F89438" }} title={money(r.revenue, currency)} />
                      <div className="w-1/2 max-w-[34px] rounded-t-md" style={{ height: `${(r.cogs / chartMax) * 100}%`, background: "#C084FC" }} title={money(r.cogs, currency)} />
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground">{r.label}</span>
                  </div>
                ))}
                {data.revCogs.length === 0 && (
                  <div className="w-full py-16 text-center text-muted-foreground">No dated invoices yet.</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-[17px] font-extrabold tracking-tight text-foreground">Margin waterfall</h3>
              <div className="mt-0.5 text-[13px] text-muted-foreground">Year to date</div>
              <div className="mt-5 space-y-4">
                {data.waterfall.map((w) => (
                  <div key={w.label}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-semibold text-foreground">{w.label}</span>
                      <span className="tabular text-muted-foreground">{money(w.value, currency)}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(w.pct, 2)}%`, background: WF_COLOR[w.tone] ?? "#2E9E6B" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-end justify-between border-t border-border/60 pt-4">
                <div>
                  <div className="text-[12px] font-semibold uppercase text-muted-foreground">Net profit margin</div>
                  <div className="text-[22px] font-extrabold text-[#2E9E6B]">{data.netMarginPct}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold uppercase text-muted-foreground">Effective tax</div>
                  <div className="text-[22px] font-extrabold text-foreground tabular">{data.effectiveTaxPct}%</div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
