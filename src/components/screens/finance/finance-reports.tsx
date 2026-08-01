"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/tone-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";
import { useCurrency, money } from "@/lib/currency";
import { FinanceHeader } from "@/components/screens/finance/finance-header";
import { FinanceFormSheet } from "@/components/screens/finance/finance-form-sheet";
import { downloadCsv } from "@/lib/export-csv";

interface Line { code?: string; name: string; amount?: number; debit?: number; credit?: number }
interface Statements {
  trialBalance: { rows: Line[]; totalDebit: number; totalCredit: number; balanced: boolean };
  pnl: {
    revenue: Line[]; totalRevenue: number; cogs: number; grossProfit: number;
    expenses: Line[]; opex: number; totalExpense: number; netProfit: number; netMarginPct: number;
  };
  balanceSheet: {
    assets: Line[]; totalAssets: number; liabilities: Line[]; totalLiabilities: number;
    equity: Line[]; retained: number; totalEquityRE: number; balanced: boolean;
  };
  cashFlow: { netProfit: number; endingCash: number };
}

interface Vat { ratePct: number; revenueBase: number; costBase: number; output: number; input: number; net: number }
interface BudgetRow { account: string; code: string; budget: number; actual: number; variance: number }
interface Budget { fiscalYear: number; rows: BudgetRow[]; totalBudget: number; totalActual: number; totalVariance: number }
interface Asset { public_id: string; asset_no: string; name: string; category: string; cost: number; monthly: number; accumulated: number; nbv: number; status: string }
interface Periods { rows: { public_id: string; name: string; start: string; end: string; status: string }[] }

export function FinanceReports() {
  const { currency } = useCurrency();
  const qc = useQueryClient();
  const year = new Date().getFullYear();
  const [assetOpen, setAssetOpen] = React.useState(false);

  const { data } = useQuery<Statements>({
    queryKey: ["finance", "statements", currency],
    queryFn: () => apiGet<Statements>(`/finance/statements?currency=${currency}`),
    enabled: USE_BACKEND,
  });
  const { data: vat } = useQuery<Vat>({
    queryKey: ["finance", "vat", currency],
    queryFn: () => apiGet<Vat>(`/finance/vat-return?currency=${currency}`),
    enabled: USE_BACKEND,
  });
  const { data: budget } = useQuery<Budget>({
    queryKey: ["finance", "budget", year, currency],
    queryFn: () => apiGet<Budget>(`/finance/budget?year=${year}&currency=${currency}`),
    enabled: USE_BACKEND,
  });
  const { data: assets } = useQuery<{ rows: Asset[] }>({
    queryKey: ["finance", "assets", currency],
    queryFn: () => apiGet<{ rows: Asset[] }>(`/finance/fixed-assets?currency=${currency}`),
    enabled: USE_BACKEND,
  });
  const { data: periods } = useQuery<Periods>({
    queryKey: ["finance", "periods"],
    queryFn: () => apiGet<Periods>("/finance/periods"),
    enabled: USE_BACKEND,
  });

  const setPeriod = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "close" | "reopen" }) =>
      apiPost(`/finance/periods/${id}/${action}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "periods"] }),
  });
  const depreciate = useMutation({
    mutationFn: (id: string) => apiPost(`/finance/fixed-assets/${id}/depreciate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "assets"] });
      qc.invalidateQueries({ queryKey: ["finance", "statements"] });
    },
  });
  const createAsset = useMutation({
    mutationFn: (v: Record<string, string | number>) =>
      apiPost("/finance/fixed-assets", {
        name: v.name, category: v.category || null, cost: v.cost,
        salvage: v.salvage || 0, life_months: v.life_months, in_service_date: v.in_service_date || null,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "assets"] }); setAssetOpen(false); },
  });

  const exportCsv = () => {
    if (!data) return;
    const rows = data.trialBalance.rows.map((r) => [r.code ?? "", r.name, r.debit ?? 0, r.credit ?? 0]);
    rows.push(["", "Totals", data.trialBalance.totalDebit, data.trialBalance.totalCredit]);
    downloadCsv("trial-balance.csv", ["Code", "Account", "Debit", "Credit"], rows);
  };

  const Row = ({ l }: { l: Line }) => (
    <tr className="border-t border-border/50">
      <td className="py-2.5 text-foreground">{l.name}</td>
      <td className="py-2.5 text-right tabular text-foreground">{money(l.amount ?? 0, currency)}</td>
    </tr>
  );
  const Total = ({ label, v, strong = true }: { label: string; v: number; strong?: boolean }) => (
    <tr className={"border-t-2 border-border " + (strong ? "font-extrabold text-foreground" : "font-semibold")}>
      <td className="py-2.5">{label}</td>
      <td className="py-2.5 text-right tabular">{money(v, currency)}</td>
    </tr>
  );

  return (
    <div>
      <FinanceHeader
        title="Financial statements"
        subtitle="Trial balance, P&L, balance sheet and cash flow — derived from the general ledger"
        onExport={exportCsv}
      />

      {!data ? (
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      ) : (
        <Tabs defaultValue="tb">
          <TabsList className="mb-5 w-full justify-start gap-0 border-b border-border/70">
            {[["tb", "Trial Balance"], ["pnl", "Profit & Loss"], ["bs", "Balance Sheet"], ["cf", "Cash Flow"],
              ["vat", "VAT return"], ["budget", "Budget vs actual"], ["assets", "Fixed assets"], ["periods", "Periods"]].map(
              ([v, l]) => (
                <TabsTrigger key={v} value={v}
                  className="mr-1 rounded-none border-b-2 border-transparent bg-transparent px-3.5 pb-3 pt-0 text-[14px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground">
                  {l}
                </TabsTrigger>
              )
            )}
          </TabsList>

          {/* Trial Balance */}
          <TabsContent value="tb">
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-extrabold text-foreground">Trial balance</h3>
                <ToneBadge tone={data.trialBalance.balanced ? "green" : "red"} dot={false}>
                  {data.trialBalance.balanced ? "Balanced ✓" : "Out of balance"}
                </ToneBadge>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 text-left font-bold">Code</th>
                    <th className="pb-2 text-left font-bold">Account</th>
                    <th className="pb-2 text-right font-bold">Debit</th>
                    <th className="pb-2 text-right font-bold">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trialBalance.rows.map((r, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="py-2.5 tabular text-muted-foreground">{r.code}</td>
                      <td className="py-2.5 text-foreground">{r.name}</td>
                      <td className="py-2.5 text-right tabular">{r.debit ? money(r.debit, currency) : "—"}</td>
                      <td className="py-2.5 text-right tabular">{r.credit ? money(r.credit, currency) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-muted/40 font-extrabold text-foreground">
                    <td className="py-2.5" colSpan={2}>Totals</td>
                    <td className="py-2.5 text-right tabular">{money(data.trialBalance.totalDebit, currency)}</td>
                    <td className="py-2.5 text-right tabular">{money(data.trialBalance.totalCredit, currency)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* P&L */}
          <TabsContent value="pnl">
            <Card className="p-6">
              <h3 className="mb-3 text-[17px] font-extrabold text-foreground">Profit &amp; loss</h3>
              <table className="w-full text-[13px]">
                <tbody>
                  <tr><td className="pb-1 pt-2 text-[11px] font-bold uppercase text-muted-foreground" colSpan={2}>Revenue</td></tr>
                  {data.pnl.revenue.map((l, i) => <Row key={"r" + i} l={l} />)}
                  <Total label="Total revenue" v={data.pnl.totalRevenue} strong={false} />
                  <Total label="Cost of goods sold" v={data.pnl.cogs} strong={false} />
                  <Total label="Gross profit" v={data.pnl.grossProfit} />
                  <tr><td className="pb-1 pt-4 text-[11px] font-bold uppercase text-muted-foreground" colSpan={2}>Operating expenses</td></tr>
                  {data.pnl.expenses.map((l, i) => <Row key={"e" + i} l={l} />)}
                  <Total label="Total operating expenses" v={data.pnl.opex} strong={false} />
                  <tr className="border-t-2 border-border font-extrabold text-[#2E9E6B]">
                    <td className="py-3">Net profit ({data.pnl.netMarginPct}% margin)</td>
                    <td className="py-3 text-right tabular">{money(data.pnl.netProfit, currency)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="bs">
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-extrabold text-foreground">Balance sheet</h3>
                <ToneBadge tone={data.balanceSheet.balanced ? "green" : "amber"} dot={false}>
                  {data.balanceSheet.balanced ? "Balanced ✓" : "Check"}
                </ToneBadge>
              </div>
              <table className="w-full text-[13px]">
                <tbody>
                  <tr><td className="pb-1 pt-2 text-[11px] font-bold uppercase text-muted-foreground" colSpan={2}>Assets</td></tr>
                  {data.balanceSheet.assets.map((l, i) => <Row key={"a" + i} l={l} />)}
                  <Total label="Total assets" v={data.balanceSheet.totalAssets} />
                  <tr><td className="pb-1 pt-4 text-[11px] font-bold uppercase text-muted-foreground" colSpan={2}>Liabilities</td></tr>
                  {data.balanceSheet.liabilities.map((l, i) => <Row key={"l" + i} l={l} />)}
                  <Total label="Total liabilities" v={data.balanceSheet.totalLiabilities} strong={false} />
                  <tr><td className="pb-1 pt-4 text-[11px] font-bold uppercase text-muted-foreground" colSpan={2}>Equity</td></tr>
                  {data.balanceSheet.equity.map((l, i) => <Row key={"q" + i} l={l} />)}
                  <tr className="border-t border-border/50">
                    <td className="py-2.5 text-foreground">Retained earnings (current)</td>
                    <td className="py-2.5 text-right tabular text-foreground">{money(data.balanceSheet.retained, currency)}</td>
                  </tr>
                  <Total label="Total liabilities + equity" v={data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquityRE} />
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Cash Flow */}
          <TabsContent value="cf">
            <Card className="p-6">
              <h3 className="mb-3 text-[17px] font-extrabold text-foreground">Cash flow (summary)</h3>
              <table className="w-full text-[13px]">
                <tbody>
                  <Total label="Net profit (operating)" v={data.cashFlow.netProfit} strong={false} />
                  <Total label="Cash & bank on hand" v={data.cashFlow.endingCash} />
                </tbody>
              </table>
              <p className="mt-4 text-[12px] text-muted-foreground">
                Summary view. A full direct/indirect cash-flow statement with working-capital
                movements comes with period close (Phase D–E).
              </p>
            </Card>
          </TabsContent>

          {/* VAT return */}
          <TabsContent value="vat">
            <Card className="p-6">
              <h3 className="mb-3 text-[17px] font-extrabold text-foreground">VAT return</h3>
              {vat && (
                <table className="w-full max-w-lg text-[13px]">
                  <tbody>
                    <Total label={`Output VAT (${vat.ratePct}% on sales)`} v={vat.output} strong={false} />
                    <Total label={`Input VAT (${vat.ratePct}% on costs)`} v={vat.input} strong={false} />
                    <tr className="border-t-2 border-border font-extrabold text-foreground">
                      <td className="py-3">Net VAT payable</td>
                      <td className="py-3 text-right tabular">{money(vat.net, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              <p className="mt-4 text-[12px] text-muted-foreground">
                Computed at the standard rate on P&amp;L revenue and deductible costs. Per-line tax
                codes and filing come with the tax engine.
              </p>
            </Card>
          </TabsContent>

          {/* Budget vs actual */}
          <TabsContent value="budget">
            <Card className="p-6">
              <h3 className="mb-3 text-[17px] font-extrabold text-foreground">Budget vs actual · FY{budget?.fiscalYear}</h3>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 text-left font-bold">Account</th>
                    <th className="pb-2 text-right font-bold">Budget</th>
                    <th className="pb-2 text-right font-bold">Actual</th>
                    <th className="pb-2 text-right font-bold">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {(budget?.rows ?? []).map((r) => (
                    <tr key={r.code} className="border-t border-border/50">
                      <td className="py-2.5 text-foreground">{r.account}</td>
                      <td className="py-2.5 text-right tabular">{money(r.budget, currency)}</td>
                      <td className="py-2.5 text-right tabular">{money(r.actual, currency)}</td>
                      <td className={"py-2.5 text-right tabular font-semibold " + (r.variance >= 0 ? "text-[#2E9E6B]" : "text-[#C0392B]")}>{money(r.variance, currency)}</td>
                    </tr>
                  ))}
                  {(!budget || budget.rows.length === 0) && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No budget lines for FY{year} yet.</td></tr>
                  )}
                  {budget && budget.rows.length > 0 && (
                    <tr className="border-t-2 border-border bg-muted/40 font-extrabold text-foreground">
                      <td className="py-2.5">Total</td>
                      <td className="py-2.5 text-right tabular">{money(budget.totalBudget, currency)}</td>
                      <td className="py-2.5 text-right tabular">{money(budget.totalActual, currency)}</td>
                      <td className="py-2.5 text-right tabular">{money(budget.totalVariance, currency)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Fixed assets */}
          <TabsContent value="assets">
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-extrabold text-foreground">Fixed asset register</h3>
                <Button size="sm" variant="navy" onClick={() => setAssetOpen(true)}>New asset</Button>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 text-left font-bold">Asset</th>
                    <th className="pb-2 text-left font-bold">Category</th>
                    <th className="pb-2 text-right font-bold">Cost</th>
                    <th className="pb-2 text-right font-bold">Monthly dep.</th>
                    <th className="pb-2 text-right font-bold">Accumulated</th>
                    <th className="pb-2 text-right font-bold">Net book value</th>
                    <th className="pb-2 text-right font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {(assets?.rows ?? []).map((a) => (
                    <tr key={a.public_id} className="border-t border-border/50">
                      <td className="py-2.5"><span className="font-bold text-foreground">{a.name}</span><span className="ml-2 tabular text-muted-foreground">{a.asset_no}</span></td>
                      <td className="py-2.5 text-muted-foreground">{a.category}</td>
                      <td className="py-2.5 text-right tabular">{money(a.cost, currency)}</td>
                      <td className="py-2.5 text-right tabular text-muted-foreground">{money(a.monthly, currency)}</td>
                      <td className="py-2.5 text-right tabular">{money(a.accumulated, currency)}</td>
                      <td className="py-2.5 text-right tabular font-semibold text-foreground">{money(a.nbv, currency)}</td>
                      <td className="py-2.5 text-right">
                        <Button size="sm" variant="outline" disabled={depreciate.isPending || a.nbv <= 0}
                          onClick={() => depreciate.mutate(a.public_id)}>Run 1 mo</Button>
                      </td>
                    </tr>
                  ))}
                  {(!assets || assets.rows.length === 0) && (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No assets registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Periods */}
          <TabsContent value="periods">
            <Card className="p-6">
              <h3 className="mb-3 text-[17px] font-extrabold text-foreground">Accounting periods</h3>
              <table className="w-full max-w-2xl text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 text-left font-bold">Period</th>
                    <th className="pb-2 text-left font-bold">Range</th>
                    <th className="pb-2 text-left font-bold">Status</th>
                    <th className="pb-2 text-right font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {(periods?.rows ?? []).map((p) => (
                    <tr key={p.public_id} className="border-t border-border/50">
                      <td className="py-2.5 font-semibold text-foreground">{p.name}</td>
                      <td className="py-2.5 text-muted-foreground">{p.start} → {p.end}</td>
                      <td className="py-2.5"><ToneBadge tone={p.status === "Closed" ? "neutral" : "green"} dot={false}>{p.status}</ToneBadge></td>
                      <td className="py-2.5 text-right">
                        <Button size="sm" variant="outline" disabled={setPeriod.isPending}
                          onClick={() => setPeriod.mutate({ id: p.public_id, action: p.status === "Closed" ? "reopen" : "close" })}>
                          {p.status === "Closed" ? "Reopen" : "Close"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!periods || periods.rows.length === 0) && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No periods defined. Closing a period blocks postings dated within it.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <FinanceFormSheet
        open={assetOpen}
        onOpenChange={setAssetOpen}
        title="New fixed asset"
        description="Register an asset for straight-line depreciation."
        submitLabel="Add asset"
        pending={createAsset.isPending}
        onSubmit={(v) => createAsset.mutate(v)}
        fields={[
          { name: "name", label: "Asset name", required: true },
          { name: "category", label: "Category", placeholder: "Equipment" },
          { name: "cost", label: "Cost", type: "number", required: true },
          { name: "salvage", label: "Salvage value", type: "number" },
          { name: "life_months", label: "Useful life (months)", type: "number", required: true },
          { name: "in_service_date", label: "In-service date", type: "date" },
        ]}
      />
    </div>
  );
}
