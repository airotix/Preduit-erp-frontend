"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { apiGet, USE_BACKEND } from "@/lib/api-client";

const CHANNELS = ["Wholesale", "Online", "Marketplace", "Retail"] as const;

export interface Suggestion {
  name: string;
  price: number;
  currency: string;
  colors?: { name: string; hex: string }[];
}

export const money = (n: number) =>
  `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface OrderLine {
  name: string;
  sku: string | null;
  qty: number;
  price: number;
}

interface OrderPayload {
  customer: string;
  channel: string;
  lines: { name: string; sku: string | null; qty: number; price: number }[];
}

/** Type-ahead product name input backed by /catalog/products/search. */
export function ProductNameInput({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (s: Suggestion) => void;
}) {
  const [items, setItems] = React.useState<Suggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!USE_BACKEND || q.trim().length < 1) {
      setItems([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await apiGet<Suggestion[]>(
          `/catalog/products/search?q=${encodeURIComponent(q.trim())}`
        );
        setItems(res);
        setOpen(res.length > 0);
      } catch {
        setItems([]);
      }
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        placeholder="Start typing an item…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          query(e.target.value);
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        autoComplete="off"
      />
      {open && items.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
          {items.map((s) => (
            <li key={s.name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(s);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-muted"
              >
                <span className="font-semibold text-foreground">{s.name}</span>
                <span className="tabular text-muted-foreground">{money(s.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrderForm({
  pending,
  onSubmit,
}: {
  pending?: boolean;
  onSubmit: (payload: OrderPayload) => void;
}) {
  const [customer, setCustomer] = React.useState("");
  const [channel, setChannel] = React.useState<string>("Wholesale");
  const [lines, setLines] = React.useState<OrderLine[]>([
    { name: "", sku: null, qty: 1, price: 0 },
  ]);
  const [error, setError] = React.useState<string | null>(null);

  const patch = (i: number, next: Partial<OrderLine>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...next } : l)));
  const addLine = () =>
    setLines((ls) => [...ls, { name: "", sku: null, qty: 1, price: 0 }]);
  const removeLine = (i: number) =>
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, j) => j !== i)));

  const grand = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

  const submit = () => {
    if (!customer.trim()) {
      setError("Customer is required.");
      return;
    }
    const valid = lines.filter((l) => l.name.trim() && Number(l.qty) > 0);
    if (valid.length === 0) {
      setError("Add at least one item with a name and quantity.");
      return;
    }
    setError(null);
    onSubmit({
      customer: customer.trim(),
      channel,
      lines: valid.map((l) => ({
        name: l.name.trim(),
        sku: l.sku,
        qty: Math.floor(Number(l.qty)) || 0,
        price: Number(l.price) || 0,
      })),
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="erp-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-6">
        <div className="space-y-1.5">
          <Label htmlFor="customer">
            Customer<span className="ml-0.5 text-brand-orange">*</span>
          </Label>
          <Input
            id="customer"
            placeholder="Customer name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="channel">
            Channel<span className="ml-0.5 text-brand-orange">*</span>
          </Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger id="channel">
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Items<span className="ml-0.5 text-brand-orange">*</span>
          </Label>

          <div className="space-y-2.5">
            {lines.map((l, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 p-3"
              >
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <ProductNameInput
                    value={l.name}
                    onChange={(v) => patch(i, { name: v })}
                    onPick={(s) => patch(i, { name: s.name, price: s.price, sku: null })}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    aria-label="Remove item"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 disabled:opacity-40"
                    disabled={lines.length === 1}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Qty
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) =>
                        patch(i, { qty: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Unit price (€)
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={l.price}
                      onChange={(e) => patch(i, { price: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </div>
                  <div className="pb-2 text-right">
                    <span className="block text-[11px] font-semibold uppercase text-muted-foreground">
                      Line
                    </span>
                    <span className="font-bold tabular text-foreground">
                      {money((Number(l.qty) || 0) * (Number(l.price) || 0))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Plus size={15} strokeWidth={2.5} /> Add item
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-[13px] font-semibold text-muted-foreground">Order total</span>
          <span className="text-[18px] font-extrabold tabular text-foreground">
            {money(grand)}
          </span>
        </div>

        {error && (
          <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">
            {error}
          </div>
        )}
      </div>

      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Create order"}
        </Button>
      </SheetFooter>
    </div>
  );
}
