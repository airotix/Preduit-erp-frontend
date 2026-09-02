"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/tone-badge";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";
import { useCurrency, money } from "@/lib/currency";
import { FinanceHeader } from "@/components/screens/finance/finance-header";
import { FinanceFormSheet } from "@/components/screens/finance/finance-form-sheet";
import { useModuleAccess } from "@/lib/module-access";
import type { Tone } from "@/lib/tone";

interface Acct { public_id: string; name: string; account_no: string; currency: string }
interface Txn {
  public_id: string; date: string; description: string; amount: number;
  status: string; matchedRef: string | null;
}
interface Detail {
  name: string; account_no: string; currency: string; statementBalance: number;
  matched: number; reconciled: number; unmatched: number; rows: Txn[];
}

const STATUS_TONE: Record<string, Tone> = {
  Unmatched: "amber", Matched: "navy", Reconciled: "green",
};

export function FinanceBanking() {
  const { currency } = useCurrency();
  const { canWrite, reason: writeReason } = useModuleAccess("finance");
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [acctOpen, setAcctOpen] = React.useState(false);
  const [lineOpen, setLineOpen] = React.useState(false);

  const { data: list } = useQuery<{ accounts: Acct[] }>({
    queryKey: ["finance", "bank", "accounts"],
    queryFn: () => apiGet<{ accounts: Acct[] }>("/finance/bank-accounts"),
    enabled: USE_BACKEND,
  });
  const accounts = list?.accounts ?? [];
  const activeId = selected ?? accounts[0]?.public_id ?? null;

  const { data: detail } = useQuery<Detail>({
    queryKey: ["finance", "bank", "detail", activeId, currency],
    queryFn: () => apiGet<Detail>(`/finance/bank-accounts/${activeId}/transactions?currency=${currency}`),
    enabled: USE_BACKEND && !!activeId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["finance", "bank"] });
  };
  const autoMatch = useMutation({
    mutationFn: () => apiPost(`/finance/bank-accounts/${activeId}/auto-match`, {}),
    onSuccess: invalidate,
  });
  const reconcile = useMutation({
    mutationFn: () => apiPost(`/finance/bank-accounts/${activeId}/reconcile`, {}),
    onSuccess: invalidate,
  });
  const createAcct = useMutation({
    mutationFn: (v: Record<string, string | number>) =>
      apiPost("/finance/bank-accounts", { name: v.name, account_no: v.account_no || null, gl_code: v.gl_code || null, currency: v.currency || "EUR" }),
    onSuccess: () => { invalidate(); setAcctOpen(false); },
  });
  const addLine = useMutation({
    mutationFn: (v: Record<string, string | number>) =>
      apiPost(`/finance/bank-accounts/${activeId}/transactions`, { txn_date: v.txn_date || null, description: v.description, amount: v.amount }),
    onSuccess: () => { invalidate(); setLineOpen(false); },
  });

  return (
    <div>
      <FinanceHeader
        title="Bank reconciliation"
        subtitle="Match imported statement lines to recorded payments"
        action="New account"
        onAction={() => setAcctOpen(true)}
        actionDisabled={!canWrite}
        actionDisabledReason={writeReason ?? undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="h-max p-3">
          <div className="px-2 pb-2 text-[11px] font-bold uppercase text-muted-foreground">Accounts</div>
          <div className="space-y-1">
            {accounts.map((a) => {
              const active = a.public_id === activeId;
              return (
                <button key={a.public_id} onClick={() => setSelected(a.public_id)}
                  className={"flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition-colors " +
                    (active ? "border-brand-orange bg-[#FFF6EF]" : "border-transparent hover:bg-muted/60")}>
                  <span className="text-[13px] font-bold text-foreground">{a.name}</span>
                  <span className="text-[11px] text-muted-foreground">{a.account_no} · {a.currency}</span>
                </button>
              );
            })}
            {accounts.length === 0 && <div className="py-6 text-center text-[13px] text-muted-foreground">No bank accounts yet.</div>}
          </div>
        </Card>

        <div className="space-y-4">
          {!detail ? (
            <Card className="p-10 text-center text-muted-foreground">Select a bank account…</Card>
          ) : (
            <>
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[18px] font-extrabold tracking-tight text-foreground">{detail.name}</div>
                    <div className="text-[13px] text-muted-foreground">{detail.account_no} · {detail.currency}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Button size="sm" variant="outline" disabled={!canWrite}
                      title={!canWrite ? writeReason ?? undefined : undefined}
                      onClick={() => setLineOpen(true)}>Add line</Button>
                    <Button size="sm" variant="outline" disabled={autoMatch.isPending || !canWrite}
                      title={!canWrite ? writeReason ?? undefined : undefined}
                      onClick={() => autoMatch.mutate()}>Auto-match</Button>
                    <Button size="sm" variant="navy" disabled={reconcile.isPending || detail.matched === 0 || !canWrite}
                      title={!canWrite ? writeReason ?? undefined : undefined}
                      onClick={() => reconcile.mutate()}>Reconcile matched</Button>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { k: "Statement balance", v: money(detail.statementBalance, currency), c: "#1A1D26" },
                    { k: "Unmatched", v: String(detail.unmatched), c: "#D29A22" },
                    { k: "Matched", v: String(detail.matched), c: "#3A4256" },
                    { k: "Reconciled", v: String(detail.reconciled), c: "#2E9E6B" },
                  ].map((t) => (
                    <div key={t.k} className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{t.k}</div>
                      <div className="mt-1 text-[17px] font-extrabold tabular" style={{ color: t.c }}>{t.v}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 text-left font-bold">Date</th>
                      <th className="pb-2 text-left font-bold">Description</th>
                      <th className="pb-2 text-right font-bold">Amount</th>
                      <th className="pb-2 text-left font-bold">Status</th>
                      <th className="pb-2 text-left font-bold">Matched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.rows.map((t) => (
                      <tr key={t.public_id} className="border-t border-border/50">
                        <td className="py-2.5 whitespace-nowrap text-muted-foreground">{t.date}</td>
                        <td className="py-2.5 text-foreground">{t.description}</td>
                        <td className={"py-2.5 text-right tabular font-semibold " + (t.amount >= 0 ? "text-[#2E9E6B]" : "text-[#C0392B]")}>{money(t.amount, currency)}</td>
                        <td className="py-2.5"><ToneBadge tone={STATUS_TONE[t.status] ?? "neutral"} dot={false}>{t.status}</ToneBadge></td>
                        <td className="py-2.5 tabular text-muted-foreground">{t.matchedRef ?? "—"}</td>
                      </tr>
                    ))}
                    {detail.rows.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No statement lines. Add one to reconcile.</td></tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      </div>

      <FinanceFormSheet
        open={acctOpen} onOpenChange={setAcctOpen}
        title="New bank account" description="Add a bank account to reconcile."
        submitLabel="Add account" pending={createAcct.isPending}
        onSubmit={(v) => createAcct.mutate(v)}
        fields={[
          { name: "name", label: "Account name", required: true, placeholder: "Main current account" },
          { name: "account_no", label: "Account number", placeholder: "•••• 4821" },
          { name: "gl_code", label: "GL account code", placeholder: "1000" },
          { name: "currency", label: "Currency", placeholder: "EUR" },
        ]}
      />
      <FinanceFormSheet
        open={lineOpen} onOpenChange={setLineOpen}
        title="Add statement line" description="Positive = deposit, negative = withdrawal."
        submitLabel="Add line" pending={addLine.isPending}
        onSubmit={(v) => addLine.mutate(v)}
        fields={[
          { name: "txn_date", label: "Date", type: "date" },
          { name: "description", label: "Description", required: true },
          { name: "amount", label: "Amount (+/−)", type: "number", required: true },
        ]}
      />
    </div>
  );
}
