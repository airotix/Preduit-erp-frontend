"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Check, X, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ToneBadge } from "@/components/tone-badge";
import { avatarColor } from "@/lib/tone";
import { apiGet, apiPost, apiPut, USE_BACKEND } from "@/lib/api-client";
import { useCurrency, money } from "@/lib/currency";
import { FinanceHeader } from "@/components/screens/finance/finance-header";
import { FinanceFormSheet } from "@/components/screens/finance/finance-form-sheet";
import { OrderPaymentModal } from "@/components/screens/sales/order-payment-modal";
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
  // Present on unpaid customer invoice rows → enables the per-row Record payment.
  invoicePublicId?: string | null; baseAmount?: number | null;
  // Handle to inline-edit this row's description (routed to its source record).
  editType?: string | null; editId?: string | null;
}

/** Inline-editable description cell (click to edit → input with ✓ / ✕). */
function EditableDesc({
  value, editable, onSave,
}: {
  value: string;
  editable: boolean;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value);
  React.useEffect(() => setVal(value), [value]);

  if (!editable) return <span className="text-foreground">{value}</span>;
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setVal(value); setEditing(true); }}
        className="group inline-flex items-center gap-1.5 text-left text-foreground hover:text-brand-orange"
      >
        <span>{value}</span>
        <Pencil size={12} className="opacity-0 transition-opacity group-hover:opacity-60" />
      </button>
    );
  }
  const commit = () => { onSave(val.trim()); setEditing(false); };
  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full min-w-[160px] rounded-md border border-primary/60 px-2 py-1 text-[13px] outline-none"
      />
      <button type="button" onClick={commit} aria-label="Save"
        className="rounded-md border border-border p-1 text-foreground hover:bg-muted">
        <Check size={13} strokeWidth={2.4} />
      </button>
      <button type="button" onClick={() => setEditing(false)} aria-label="Cancel"
        className="rounded-md border border-border p-1 text-muted-foreground hover:bg-muted">
        <X size={13} strokeWidth={2.4} />
      </button>
    </span>
  );
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
  // Per-row "Record payment" target (unpaid customer invoice).
  const [settle, setSettle] = React.useState<{ invoicePublicId: string; total: number; ref: string } | null>(null);

  const entriesBase = isCustomer ? "/finance/customer-ledger" : "/finance/supplier-ledger";
  const create = useMutation({
    mutationFn: (v: Record<string, string | number>) =>
      apiPost(`${entriesBase}/${activeId}/entries`, {
        description: v.description,
        debit: Number(v.debit) || 0,
        credit: Number(v.credit) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "ledger"] });
      setFormOpen(false);
    },
  });

  // Inline description edits (invoice memo / manual entry / payment note / credit note).
  const saveDesc = useMutation({
    mutationFn: (b: { type: string; publicId: string; description: string }) =>
      apiPut("/finance/ledger-entries/description", b),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finance", "ledger"] }),
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
        action="New entry"
        onAction={() => setFormOpen(true)}
        onExport={exportCsv}
      />

      <FinanceFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={`New entry${stmt?.name ? ` · ${stmt.name}` : ""}`}
        description="Add a manual ledger entry — a debit and/or credit with a description."
        submitLabel="Add entry"
        pending={create.isPending}
        onSubmit={(v) => create.mutate(v)}
        fields={[
          { name: "description", label: "Description", required: true },
          { name: "debit", label: "Debit amount", type: "number" },
          { name: "credit", label: "Credit amount", type: "number" },
        ]}
      />

      {settle && (
        <OrderPaymentModal
          open={!!settle}
          onOpenChange={(o) => { if (!o) setSettle(null); }}
          settleUrl={isCustomer
            ? `/sales/invoices/${settle.invoicePublicId}/settle`
            : `/finance/bills/${settle.invoicePublicId}/settle`}
          total={settle.total}
          reference={settle.ref}
          customer={stmt?.name ?? ""}
          format={(n) => money(n, currency)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ["finance", "ledger"] });
            setSettle(null);
          }}
        />
      )}

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
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/50">
                      <td className="py-2.5 font-semibold text-muted-foreground" colSpan={5}>Opening balance</td>
                      <td className="py-2.5 text-right tabular text-foreground">{money(stmt.opening, currency)}</td>
                      <td />
                    </tr>
                    {stmt.rows.map((r, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="py-2.5 whitespace-nowrap text-muted-foreground">{r.date}</td>
                        <td className="py-2.5 font-bold tabular text-foreground">{r.ref}</td>
                        <td className="py-2.5 text-foreground">
                          <EditableDesc
                            value={r.desc}
                            editable={!!r.editId}
                            onSave={(v) =>
                              saveDesc.mutate({ type: r.editType as string, publicId: r.editId as string, description: v })
                            }
                          />
                        </td>
                        <td className="py-2.5 text-right tabular text-foreground">{r.debit ? money(r.debit, currency) : "—"}</td>
                        <td className="py-2.5 text-right tabular text-[#2E9E6B]">{r.credit ? money(r.credit, currency) : "—"}</td>
                        <td className="py-2.5 text-right tabular font-semibold text-foreground">{money(r.balance, currency)}</td>
                        <td className="py-2.5 pl-3 text-right">
                          {r.invoicePublicId && (
                            <button
                              type="button"
                              onClick={() => setSettle({
                                invoicePublicId: r.invoicePublicId as string,
                                total: r.baseAmount ?? r.debit ?? 0,
                                ref: r.ref,
                              })}
                              className="whitespace-nowrap rounded-lg border border-border/70 px-2.5 py-1 text-[12px] font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
                            >
                              Record payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-muted/40 font-extrabold text-foreground">
                      <td className="py-2.5" colSpan={3}>Totals</td>
                      <td className="py-2.5 text-right tabular">{money(stmt.totalDebit, currency)}</td>
                      <td className="py-2.5 text-right tabular text-[#2E9E6B]">{money(stmt.totalCredit, currency)}</td>
                      <td className="py-2.5 text-right tabular" style={{ color: stmt.balanceTone === "accent" ? "#7C3AED" : "#EA6C18" }}>{money(stmt.closing, currency)}</td>
                      <td />
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
