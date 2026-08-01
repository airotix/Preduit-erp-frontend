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
import { ProductNameInput, money } from "@/components/screens/order-form";

interface ColorOption {
  name: string;
  hex: string;
}

interface POLine {
  name: string;
  color: string;
  sku: string | null;
  price: number;
  /** Colors specific to the picked product (empty until an item is chosen). */
  colorOptions: ColorOption[];
  /** Per-size quantity breakdown: size label → units. */
  sizeQty: Record<string, number>;
}

interface POApiLine {
  name: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  qty: number;
  price: number;
}

interface POPayload {
  supplier: string;
  expected: string;
  lines: POApiLine[];
}

const newLine = (): POLine => ({
  name: "",
  color: "",
  sku: null,
  price: 0,
  colorOptions: [],
  sizeQty: {},
});

const lineUnits = (l: POLine) =>
  Object.values(l.sizeQty).reduce((s, q) => s + (Number(q) || 0), 0);

export function PurchaseOrderForm({
  pending,
  onSubmit,
}: {
  pending?: boolean;
  onSubmit: (payload: POPayload) => void;
}) {
  const [supplier, setSupplier] = React.useState("");
  const [expected, setExpected] = React.useState("");
  const [colors, setColors] = React.useState<ColorOption[]>([]);
  const [sizes, setSizes] = React.useState<string[]>([]);
  const [lines, setLines] = React.useState<POLine[]>([newLine()]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!USE_BACKEND) return;
    apiGet<ColorOption[]>("/catalog/colors").then(setColors).catch(() => setColors([]));
    apiGet<string[]>("/catalog/sizes").then(setSizes).catch(() => setSizes([]));
  }, []);

  const patch = (i: number, next: Partial<POLine>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...next } : l)));
  const setSize = (i: number, size: string, val: number) =>
    setLines((ls) =>
      ls.map((l, j) =>
        j === i ? { ...l, sizeQty: { ...l.sizeQty, [size]: val } } : l
      )
    );
  const addLine = () => setLines((ls) => [...ls, newLine()]);
  const removeLine = (i: number) =>
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, j) => j !== i)));

  // Picking a product loads its own colors and drops a stale colour pick.
  const pickProduct = (
    i: number,
    s: { name: string; price: number; colors?: ColorOption[] }
  ) => {
    const opts = s.colors ?? [];
    setLines((ls) =>
      ls.map((l, j) =>
        j === i
          ? {
              ...l,
              name: s.name,
              price: s.price,
              sku: null,
              colorOptions: opts,
              color: opts.some((c) => c.name === l.color) ? l.color : "",
            }
          : l
      )
    );
  };

  const grand = lines.reduce((s, l) => s + lineUnits(l) * (Number(l.price) || 0), 0);

  const submit = () => {
    if (!supplier.trim()) return setError("Supplier is required.");
    if (!expected.trim()) return setError("Expected date is required.");
    const apiLines: POApiLine[] = [];
    for (const l of lines) {
      if (!l.name.trim()) continue;
      for (const size of sizes) {
        const q = Math.floor(Number(l.sizeQty[size]) || 0);
        if (q > 0) {
          apiLines.push({
            name: l.name.trim(),
            color: l.color.trim() || null,
            size,
            sku: null,
            qty: q,
            price: Number(l.price) || 0,
          });
        }
      }
    }
    if (apiLines.length === 0)
      return setError("Add at least one item and enter a quantity for one or more sizes.");
    setError(null);
    onSubmit({ supplier: supplier.trim(), expected: expected.trim(), lines: apiLines });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="erp-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-6">
        <div className="space-y-1.5">
          <Label htmlFor="supplier">
            Supplier<span className="ml-0.5 text-brand-orange">*</span>
          </Label>
          <Input
            id="supplier"
            placeholder="Supplier name"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expected">
            Expected<span className="ml-0.5 text-brand-orange">*</span>
          </Label>
          <Input
            id="expected"
            type="date"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Items<span className="ml-0.5 text-brand-orange">*</span>
          </Label>

          <div className="space-y-3">
            {lines.map((l, i) => {
              const opts = l.colorOptions.length ? l.colorOptions : colors;
              const colorHint =
                l.name && !l.colorOptions.length ? "No colors for item" : "Color";
              const units = lineUnits(l);
              return (
                <div key={i} className="rounded-xl border border-border/60 p-3">
                  {/* Item + remove */}
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <ProductNameInput
                      value={l.name}
                      onChange={(v) => patch(i, { name: v })}
                      onPick={(s) => pickProduct(i, s)}
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

                  {/* Color + unit price */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Color
                      </span>
                      <Select value={l.color} onValueChange={(v) => patch(i, { color: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder={colorHint} />
                        </SelectTrigger>
                        <SelectContent>
                          {opts.map((c) => (
                            <SelectItem key={c.name} value={c.name}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full border border-black/10"
                                  style={{ background: c.hex }}
                                />
                                {c.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        onChange={(e) =>
                          patch(i, { price: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </div>
                  </div>

                  {/* Size breakdown */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Size breakdown
                    </span>
                    {sizes.length === 0 ? (
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        No sizes in the catalog yet.
                      </p>
                    ) : (
                      <div className="mt-1.5 grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                        {sizes.map((s) => (
                          <div key={s} className="space-y-0.5">
                            <span className="block text-center text-[10px] font-bold uppercase text-muted-foreground">
                              {s}
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={l.sizeQty[s] ?? 0}
                              onChange={(e) =>
                                setSize(i, s, Math.max(0, Math.floor(Number(e.target.value) || 0)))
                              }
                              className="w-full rounded-lg border border-border/60 py-1.5 text-center text-[13px] font-bold tabular outline-none focus:border-primary"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Line summary */}
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[13px]">
                    <span className="text-muted-foreground">
                      {units.toLocaleString()} unit{units === 1 ? "" : "s"}
                    </span>
                    <span className="font-bold tabular text-foreground">
                      {money(units * (Number(l.price) || 0))}
                    </span>
                  </div>
                </div>
              );
            })}
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
          <span className="text-[13px] font-semibold text-muted-foreground">PO total</span>
          <span className="text-[18px] font-extrabold tabular text-foreground">{money(grand)}</span>
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
          {pending ? "Saving…" : "Create PO"}
        </Button>
      </SheetFooter>
    </div>
  );
}
