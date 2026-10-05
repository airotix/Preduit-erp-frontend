"use client";
import { Table as ResponsiveTable } from "@/components/ui/table";


import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { apiGet, apiPut, apiPost, USE_BACKEND } from "@/lib/api-client";
import { useCurrency, money } from "@/lib/currency";
import { FinanceHeader } from "@/components/screens/finance/finance-header";
import { FinanceFormSheet } from "@/components/screens/finance/finance-form-sheet";
import { EditableDesc, PaymentTypeCell } from "@/components/screens/finance/finance-ledger";
import { downloadCsv } from "@/lib/export-csv";
import { useModuleAccess } from "@/lib/module-access";

interface LedgerRow {
  date: string; ref: string; party: string; partyType?: "customer" | "supplier" | "other" | null;
  source?: string | null; desc: string;
  debit: number | null; credit: number | null; balance: number;
  editType?: string | null; editId?: string | null;
  paymentType?: "cash" | "bank" | null;
}
interface Ledger {
  kind: "cash" | "bank"; label: string;
  opening: number; totalDebit: number; totalCredit: number; closing: number;
  rows: LedgerRow[];
}

/** Cleared money movements and manual entries in one running-balance table. */
export function FinanceCashBankLedger({ kind }: { kind: "cash" | "bank" }) {
  const { currency } = useCurrency();
  const { canWrite } = useModuleAccess("finance");
  const queryClient = useQueryClient();
  const path = kind === "cash" ? "/finance/cash-ledger" : "/finance/bank-ledger";

  const { data } = useQuery<Ledger>({
    queryKey: ["finance", "ledger", kind, currency],
    queryFn: () => apiGet<Ledger>(`${path}?currency=${currency}`),
    enabled: USE_BACKEND,
  });

  const [formOpen, setFormOpen] = React.useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
  };
  const create = useMutation({
    mutationFn: (v: Record<string, string | number>) =>
      apiPost(`${path}/entries`, {
        description: v.description,
        debit: Number(v.debit) || 0,
        credit: Number(v.credit) || 0,
      }),
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });
  const saveDesc = useMutation({
    mutationFn: (b: { type: string; publicId: string; description: string }) =>
      apiPut("/finance/ledger-entries/description", b),
    onSuccess: invalidate,
  });
  const savePaymentType = useMutation({
    mutationFn: (b: { type: string; publicId: string; paymentType: string }) =>
      apiPut("/finance/ledger-entries/payment-type", b),
    onSuccess: invalidate,
  });

  const exportCsv = () => {
    if (!data) return;
    const rows: (string | number)[][] = [["", "", "", "", "Opening balance", "", "", data.opening]];
    data.rows.forEach((r) => rows.push([
      r.date, r.ref, r.party, r.source ?? "", r.desc,
      r.debit ?? "", r.credit ?? "", r.balance,
    ]));
    rows.push(["", "", "", "", "Totals", data.totalDebit, data.totalCredit, data.closing]);
    downloadCsv(
      `${kind}-ledger.csv`,
      ["Date", "Reference", "Party", "Source", "Description", "Debit (money out)", "Credit (money in)", "Balance"],
      rows
    );
  };

  return (
    <div>
      <FinanceHeader
        title={kind === "cash" ? "Cash ledger" : "Bank ledger"}
        subtitle={
          kind === "cash"
            ? "Cleared cash receipts, payments and manual entries. Credit = money in; Debit = money out."
            : "Cleared bank receipts, payments and manual entries. Credit = money in; Debit = money out."
        }
        action="New entry"
        onAction={canWrite ? () => setFormOpen(true) : undefined}
        actionDisabled={!canWrite}
        onExport={exportCsv}
      />

      <FinanceFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={`New ${kind === "cash" ? "cash" : "bank"} ledger entry`}
        description="Credit = money received from anyone. Debit = money paid to suppliers or anyone else. Enter one direction per entry."
        submitLabel="Add entry"
        pending={create.isPending}
        serverError={create.error instanceof Error ? create.error.message : undefined}
        onSubmit={(v) => create.mutate(v)}
        fields={[
          { name: "description", label: "Description", required: true },
          { name: "debit", label: "Debit — money out", type: "number", placeholder: "0.00" },
          { name: "credit", label: "Credit — money in", type: "number", placeholder: "0.00" },
        ]}
      />

      {!data ? (
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      ) : (
        <Card className="p-6">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Opening balance", v: data.opening, tone: undefined },
              { k: "Debit · money out", v: data.totalDebit, tone: undefined },
              { k: "Credit · money in", v: data.totalCredit, tone: "#2E9E6B" },
              { k: "Closing balance", v: data.closing, tone: data.closing >= 0 ? "#EA6C18" : "#C0392B" },
            ].map((t) => (
              <div key={t.k} className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{t.k}</div>
                <div className="mt-1 text-[17px] font-extrabold tabular" style={{ color: t.tone ?? "#1A1D26" }}>
                  {money(t.v, currency)}
                </div>
              </div>
            ))}
          </div>

          <ResponsiveTable className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 text-left font-bold">Date</th>
                <th className="pb-2 text-left font-bold">Reference</th>
                <th className="pb-2 text-left font-bold">Party</th>
                <th className="pb-2 text-left font-bold">Source</th>
                <th className="pb-2 text-left font-bold">Description</th>
                <th className="pb-2 text-left font-bold">Payment Type</th>
                <th className="pb-2 text-right font-bold">Debit · out</th>
                <th className="pb-2 text-right font-bold">Credit · in</th>
                <th className="pb-2 text-right font-bold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-2.5 whitespace-nowrap text-muted-foreground">{r.date}</td>
                  <td className="py-2.5 font-bold tabular text-foreground">{r.ref}</td>
                  <td className="py-2.5 text-foreground">
                    <span className="font-semibold">{r.party}</span>
                    {r.partyType && (
                      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                        ({r.partyType === "customer" ? "Customer" : r.partyType === "supplier" ? "Supplier" : "Other"})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{r.source ?? "—"}</td>
                  <td className="py-2.5 text-foreground">
                    <EditableDesc
                      value={r.desc}
                      editable={!!r.editId && canWrite}
                      onSave={(v) =>
                        saveDesc.mutate({ type: r.editType as string, publicId: r.editId as string, description: v })
                      }
                    />
                  </td>
                  <td className="py-2.5 text-foreground">
                    <PaymentTypeCell
                      allowUnset={false}
                      value={r.paymentType}
                      editable={!!r.editId && canWrite}
                      onSave={(v) =>
                        savePaymentType.mutate({ type: r.editType as string, publicId: r.editId as string, paymentType: v })
                      }
                    />
                  </td>
                  <td className="py-2.5 text-right tabular text-foreground">{r.debit ? money(r.debit, currency) : "—"}</td>
                  <td className="py-2.5 text-right tabular text-[#2E9E6B]">{r.credit ? money(r.credit, currency) : "—"}</td>
                  <td className="py-2.5 text-right tabular font-semibold text-foreground">{money(r.balance, currency)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">
                  No lines tagged {kind === "cash" ? "Cash" : "Bank"} yet.
                </td></tr>
              )}
              <tr className="border-t-2 border-border bg-muted/40 font-extrabold text-foreground">
                <td className="py-2.5" colSpan={6}>Totals</td>
                <td className="py-2.5 text-right tabular">{money(data.totalDebit, currency)}</td>
                <td className="py-2.5 text-right tabular text-[#2E9E6B]">{money(data.totalCredit, currency)}</td>
                <td className="py-2.5 text-right tabular" style={{ color: data.closing >= 0 ? "#EA6C18" : "#C0392B" }}>
                  {money(data.closing, currency)}
                </td>
              </tr>
            </tbody>
          </ResponsiveTable>
        </Card>
      )}
    </div>
  );
}
