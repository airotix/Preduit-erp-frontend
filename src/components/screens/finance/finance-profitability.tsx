"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ToneBadge } from "@/components/tone-badge";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { useCurrency, money } from "@/lib/currency";
import { FinanceHeader } from "@/components/screens/finance/finance-header";
import { downloadCsv } from "@/lib/export-csv";
import type { Tone } from "@/lib/tone";

interface Seg {
  segment: string; revenue: number; cogs: number; gross: number;
  gmPct: number; gmTone: Tone; opex: number; tax: number; net: number; nmPct: number;
}
interface ProfitData {
  taxRatePct: number;
  kpis: {
    revenue: { value: number; sub: string };
    gross: { value: number; sub: string };
    net: { value: number; sub: string };
    margin: { pct: number; sub: string };
  };
  rows: Seg[];
  totals: Omit<Seg, "segment" | "gmTone">;
}

export function FinanceProfitability() {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const { data } = useQuery<ProfitData>({
    queryKey: ["finance", "profitability", currency],
    queryFn: () => apiGet<ProfitData>(`/finance/profitability?currency=${currency}`),
    enabled: USE_BACKEND,
  });

  const regenerate = () =>
    queryClient.invalidateQueries({ queryKey: ["finance", "profitability"] });

  const exportCsv = () => {
    if (!data) return;
    const rows: (string | number)[][] = data.rows.map((r) => [
      r.segment, r.revenue, r.cogs, r.gross, `${r.gmPct}%`, r.opex, r.tax, r.net, `${r.nmPct}%`,
    ]);
    rows.push([
      "Total", data.totals.revenue, data.totals.cogs, data.totals.gross,
      `${data.totals.gmPct}%`, data.totals.opex, data.totals.tax, data.totals.net, `${data.totals.nmPct}%`,
    ]);
    downloadCsv(
      "profitability-by-segment.csv",
      ["Segment", "Revenue", "COGS", "Gross profit", "GM %", "Opex", "Tax", "Net profit", "NM %"],
      rows
    );
  };

  const kpiCards = data && [
    { label: "Total revenue (YTD)", value: money(data.kpis.revenue.value, currency, true), sub: data.kpis.revenue.sub, green: false },
    { label: "Gross profit", value: money(data.kpis.gross.value, currency, true), sub: data.kpis.gross.sub, green: true },
    { label: "Net profit", value: money(data.kpis.net.value, currency, true), sub: data.kpis.net.sub, green: true },
    { label: "Net margin", value: `${data.kpis.margin.pct}%`, sub: data.kpis.margin.sub, green: true },
  ];

  return (
    <div>
      <FinanceHeader
        title="Profitability report"
        subtitle="Gross and net margin by business segment"
        action="New report"
        onAction={regenerate}
        onExport={exportCsv}
      />

      {!data ? (
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards!.map((c) => (
              <Card key={c.label} className="p-5">
                <div className="text-[13px] font-semibold text-muted-foreground">{c.label}</div>
                <div className={"mt-1 text-[26px] font-extrabold tracking-tight " + (c.green ? "text-[#2E9E6B]" : "text-foreground")}>
                  {c.value}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{c.sub}</div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-[17px] font-extrabold tracking-tight text-foreground">Profitability by segment</h3>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                Year to date · VAT/GST at {data.taxRatePct}% · amounts in {currency}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 text-left font-bold">Segment</th>
                    <th className="pb-2 text-right font-bold">Revenue</th>
                    <th className="pb-2 text-right font-bold">COGS</th>
                    <th className="pb-2 text-right font-bold">Gross profit</th>
                    <th className="pb-2 text-center font-bold">GM %</th>
                    <th className="pb-2 text-right font-bold">Opex</th>
                    <th className="pb-2 text-right font-bold">Tax</th>
                    <th className="pb-2 text-right font-bold">Net profit</th>
                    <th className="pb-2 text-right font-bold">NM %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.segment} className="border-t border-border/50">
                      <td className="py-3 font-bold text-foreground">{r.segment}</td>
                      <td className="py-3 text-right tabular">{money(r.revenue, currency)}</td>
                      <td className="py-3 text-right tabular text-muted-foreground">{money(r.cogs, currency)}</td>
                      <td className="py-3 text-right tabular font-semibold text-foreground">{money(r.gross, currency)}</td>
                      <td className="py-3 text-center"><ToneBadge tone={r.gmTone} dot={false}>{r.gmPct}%</ToneBadge></td>
                      <td className="py-3 text-right tabular text-muted-foreground">{money(r.opex, currency)}</td>
                      <td className="py-3 text-right tabular text-muted-foreground">{money(r.tax, currency)}</td>
                      <td className="py-3 text-right tabular font-bold text-[#2E9E6B]">{money(r.net, currency)}</td>
                      <td className="py-3 text-right tabular font-semibold text-foreground">{r.nmPct}%</td>
                    </tr>
                  ))}
                  {data.rows.length === 0 && (
                    <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">No segment revenue yet.</td></tr>
                  )}
                  <tr className="border-t-2 border-border bg-muted/40 font-extrabold text-foreground">
                    <td className="py-3">Total</td>
                    <td className="py-3 text-right tabular">{money(data.totals.revenue, currency)}</td>
                    <td className="py-3 text-right tabular">{money(data.totals.cogs, currency)}</td>
                    <td className="py-3 text-right tabular">{money(data.totals.gross, currency)}</td>
                    <td className="py-3 text-center tabular">{data.totals.gmPct}%</td>
                    <td className="py-3 text-right tabular">{money(data.totals.opex, currency)}</td>
                    <td className="py-3 text-right tabular">{money(data.totals.tax, currency)}</td>
                    <td className="py-3 text-right tabular text-[#2E9E6B]">{money(data.totals.net, currency)}</td>
                    <td className="py-3 text-right tabular">{data.totals.nmPct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
