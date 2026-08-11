"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { apiPost } from "@/lib/api-client";

const defaultMoney = (n: number) =>
  `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type PayStatus = "paid" | "partial" | "unpaid";

/** Records a receipt against a customer's receivable (unpaid invoice) so the
 *  customer ledger balance stays correct. Triggered per-row from the Finance
 *  customer ledger. Confirms whether the customer paid, and how much. */
export function OrderPaymentModal({
  open,
  onOpenChange,
  settleUrl,
  total,
  reference,
  customer,
  format,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Endpoint that records the payment, e.g. /sales/invoices/{id}/settle or
   *  /finance/bills/{id}/settle. */
  settleUrl: string | null;
  total: number;
  reference: string;
  customer: string;
  format?: (n: number) => string;
  onDone: () => void;
}) {
  const money = format ?? defaultMoney;
  const [status, setStatus] = React.useState<PayStatus>("paid");
  const [amount, setAmount] = React.useState<number>(total);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setStatus("paid");
      setAmount(total);
      setSaving(false);
      setError(null);
    }
  }, [open, total]);

  const choose = (s: PayStatus) => {
    setStatus(s);
    if (s === "paid") setAmount(total);
    else if (s === "unpaid") setAmount(0);
  };

  const submit = async () => {
    if (!settleUrl) return onDone();
    const paid = status === "paid";
    const amt = status === "unpaid" ? 0 : Math.max(0, Math.min(Number(amount) || 0, total));
    setSaving(true);
    setError(null);
    try {
      await apiPost(settleUrl, { amountPaid: amt, paid });
      onDone();
    } catch {
      setError("Could not record the payment. Please try again.");
      setSaving(false);
    }
  };

  const balance = total - (status === "unpaid" ? 0 : Math.min(Number(amount) || 0, total));
  const OPTS: { key: PayStatus; label: string; sub: string }[] = [
    { key: "paid", label: "Paid in full", sub: money(total) },
    { key: "partial", label: "Partial", sub: "Enter amount" },
    { key: "unpaid", label: "Unpaid", sub: "Bill later" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Record payment</SheetTitle>
          <SheetDescription>
            {reference} · {customer} · {money(total)}. Confirm how much was paid — this posts a
            receipt to {customer}&rsquo;s ledger.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-6 pb-6">
          <div>
            <Label className="mb-1.5 block">Payment status</Label>
            <div className="grid grid-cols-3 gap-2">
              {OPTS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => choose(o.key)}
                  className={
                    "rounded-xl border px-3 py-2.5 text-left transition-colors " +
                    (status === o.key
                      ? "border-brand-orange bg-[#FFF6EF]"
                      : "border-border/70 hover:bg-muted/60")
                  }
                >
                  <div className="text-[13px] font-bold text-foreground">{o.label}</div>
                  <div className="text-[11px] text-muted-foreground">{o.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amountPaid">Amount paid (€)</Label>
            <Input
              id="amountPaid"
              type="number"
              min={0}
              max={total}
              step="any"
              value={amount}
              disabled={status !== "partial"}
              onChange={(e) => setAmount(Math.max(0, Math.min(Number(e.target.value) || 0, total)))}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-[13px]">
            <span className="font-semibold text-muted-foreground">Balance remaining</span>
            <span className="font-extrabold tabular text-foreground">{money(balance)}</span>
          </div>

          {error && (
            <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>
          )}
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline" onClick={onDone}>Skip</Button>
          </SheetClose>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Confirm"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
