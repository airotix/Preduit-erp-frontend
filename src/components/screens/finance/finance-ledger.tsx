"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ToneBadge } from "@/components/tone-badge";
import { avatarColor } from "@/lib/tone";
import { apiGet, apiPost, USE_BACKEND } from "@/lib/api-client";
import { useCurrency, money } from "@/lib/currency";
import { FinanceHeader } from "@/components/screens/finance/finance-header";
import { FinanceFormSheet } from "@/components/screens/finance/finance-form-sheet";
import { downloadCsv } from "@/lib/export-csv";
import type { Tone } from "@/lib/tone";

interface Party {
  public_id: string; name: string; code: string; initials: string;
  balance: number; balanceTone: Tone;
}
interface ListData { variant: "customer" | "supplier"; parties: Party[] }
interface StatementRow {
  date: string; ref: string; desc: string;
  debit: number | null; credit: number | null; balance: number;
}
interface Statement {
  name: string; code: string; terms: string; email: string; initials: string;
  standingLabel: string; standingTone: Tone;
  opening: number; totalDebit: number; totalCredit: number; closing: number;
  balanceLabel: string; balanceTone: Tone; rows: StatementRow[];
}

export function FinanceLedger({ variant }: { variant: "customer" | "supplier" }) {
  const { currency } = useCurrency();
  const isCustomer = variant === "customer";
  const base = isCustomer ? "/finance/customer-ledger" : "/finance/supplier-ledger";
  const [selected, setSelected] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");

  const { data: list } = useQuery<ListData>({
    queryKey: ["finance", "ledger", variant, currency],
    queryFn: () => apiGet<ListData>(`${base}?currency=${currency}`),
    enabled: USE_BACKEND,
  });

  const parties = list?.parties ?? [];
  const activeId = selected ?? parties[0]?.public_id ?? null;
  const filtered = parties.filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.code ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const { data: stmt } = useQuery<Statement>({
    queryKey: ["finance", "ledger", variant, activeId, currency],
    queryFn: () => apiGet<Statement>(`${base}/${activeId}?currency=${currency}`),
    enabled: USE_BACKEND && !!activeId,
  });

  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = React.useState(false);

  const create = useMutation({
    mutationFn: (v: Record<string, string | number>) =>
      isCustomer
        ? apiPost("/sales/invoices", { customer: v.customer, amount: v.amount, dueDate: v.dueDate })
        : apiPost("/finance/bills", { supplier: v.supplier, poRef: v.poRef || null, amount: v.amount, dueDate: v.dueDate, status: "Open" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "ledger", variant] });
      setFormOpen(false);
    },
  });

  const exportCsv = () => {
    if (!stmt) return;
    const rows: (string | number)[][] = [["Opening balance", "", "", "", "", stmt.opening]];
    stmt.rows.forEach((r) => rows.push([r.date, r.ref, r.desc, r.debit ?? "", r.credit ?? "", r.balance]));
    rows.push(["Totals", "", "", stmt.totalDebit, stmt.totalCredit, stmt.closing]);
    downloadCsv(
      `${variant}-ledger-${stmt.code}.csv`,
      ["Date", "Reference", "Description", "Debit", "Credit", "Balance"],
      rows
    );
  };

  return (
    <div>
      <FinanceHeader
        title={isCustomer ? "Customer ledger" : "Supplier ledger"}
        subtitle={isCustomer ? "Receivables by customer with running balance" : "Payables by supplier with running balance"}
        action={isCustomer ? "New invoice" : "New bill"}
        onAction={() => setFormOpen(true)}
        onExport={exportCsv}
      />

      <FinanceFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={isCustomer ? "New invoice" : "New bill"}
        description={isCustomer ? "Raise a customer invoice." : "Record a supplier bill."}
        submitLabel={isCustomer ? "Create invoice" : "Create bill"}
        pending={create.isPending}
        onSubmit={(v) => create.mutate(v)}
        fields={
          isCustomer
            ? [
                { name: "customer", label: "Customer", required: true, defaultValue: stmt?.name },
                { name: "amount", label: "Amount", type: "number", required: true },
                { name: "dueDate", label: "Due date", type: "date" },
              ]
            : [
                { name: "supplier", label: "Supplier", required: true, defaultValue: stmt?.name },
                { name: "poRef", label: "PO reference", placeholder: "PO-5582" },
                { name: "amount", label: "Amount", type: "number", required: true },
                { name: "dueDate", label: "Due date", type: "date" },
              ]
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Party list */}
        <Card className="h-max p-3">
          <div className="mb-2 flex items-center gap-2 rounded-full border border-border/70 bg-muted px-3.5 py-2 text-muted-foreground">
            <Search size={15} strokeWidth={1.9} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isCustomer ? "Search customers…" : "Search suppliers…"}
              className="w-full border-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1">
            {filtered.map((p) => {
              const active = p.public_id === activeId;
              return (
                <button
                  key={p.public_id}
                  onClick={() => setSelected(p.public_id)}
                  className={
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors " +
                    (active ? "border-brand-orange bg-[#FFF6EF]" : "border-transparent hover:bg-muted/60")
                  }
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: avatarColor(p.name) }}
                  >
                    {p.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-foreground">{p.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{p.code}</span>
                  </span>
                  <span className="tabular text-[12px] font-bold" style={{ color: p.balance > 0 ? "#EA6C18" : "#2E9E6B" }}>
                    {money(p.balance, currency, true)}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-[13px] text-muted-foreground">No matches.</div>
            )}
          </div>
        </Card>

        {/* Statement */}
        <div className="space-y-4">
          {!stmt ? (
            <Card className="p-10 text-center text-muted-foreground">Select an account…</Card>
          ) : (
            <>
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
                      style={{ background: avatarColor(stmt.name) }}
                    >
                      {stmt.initials}
                    </span>
                    <div>
                      <div className="text-[18px] font-extrabold tracking-tight text-foreground">{stmt.name}</div>
                      <div className="text-[13px] text-muted-foreground">
                        {stmt.code} · {stmt.terms}{stmt.email ? ` · ${stmt.email}` : ""}
                      </div>
                    </div>
                  </div>
                  <ToneBadge tone={stmt.standingTone} dot={false}>{stmt.standingLabel}</ToneBadge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { k: "Opening", v: stmt.opening, tone: undefined },
                    { k: "Total debit", v: stmt.totalDebit, tone: undefined },
                    { k: "Total credit", v: stmt.totalCredit, tone: "#2E9E6B" },
                    { k: stmt.balanceLabel, v: stmt.closing, tone: stmt.balanceTone === "accent" ? "#7C3AED" : "#EA6C18" },
                  ].map((t) => (
                    <div key={t.k} className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{t.k}</div>
                      <div className="mt-1 text-[17px] font-extrabold tabular" style={{ color: t.tone ?? "#1A1D26" }}>
                        {money(t.v, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 text-left font-bold">Date</th>
                      <th className="pb-2 text-left font-bold">Reference</th>
                      <th className="pb-2 text-left font-bold">Description</th>
                      <th className="pb-2 text-right font-bold">Debit</th>
                      <th className="pb-2 text-right font-bold">Credit</th>
                      <th className="pb-2 text-right font-bold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/50">
                      <td className="py-2.5 font-semibold text-muted-foreground" colSpan={5}>Opening balance</td>
                      <td className="py-2.5 text-right tabular text-foreground">{money(stmt.opening, currency)}</td>
                    </tr>
                    {stmt.rows.map((r, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="py-2.5 whitespace-nowrap text-muted-foreground">{r.date}</td>
                        <td className="py-2.5 font-bold tabular text-foreground">{r.ref}</td>
                        <td className="py-2.5 text-foreground">{r.desc}</td>
                        <td className="py-2.5 text-right tabular text-foreground">{r.debit ? money(r.debit, currency) : "—"}</td>
                        <td className="py-2.5 text-right tabular text-[#2E9E6B]">{r.credit ? money(r.credit, currency) : "—"}</td>
                        <td className="py-2.5 text-right tabular font-semibold text-foreground">{money(r.balance, currency)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-muted/40 font-extrabold text-foreground">
                      <td className="py-2.5" colSpan={3}>Totals</td>
                      <td className="py-2.5 text-right tabular">{money(stmt.totalDebit, currency)}</td>
                      <td className="py-2.5 text-right tabular text-[#2E9E6B]">{money(stmt.totalCredit, currency)}</td>
                      <td className="py-2.5 text-right tabular" style={{ color: stmt.balanceTone === "accent" ? "#7C3AED" : "#EA6C18" }}>{money(stmt.closing, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
