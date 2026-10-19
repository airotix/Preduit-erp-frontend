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
import { zeroToBlank } from "@/lib/number-input";
import { ProductNameInput, money, type Suggestion } from "@/components/screens/order-form";

interface ColorOption {
  name: string;
  hex: string;
}

interface POLine {
  name: string;
  supplierId: string;
  color: string;
  sku: string | null;
  /** Colors specific to the picked product (empty until an item is chosen). */
  colorOptions: ColorOption[];
  /** Per-size quantity breakdown: size label → units. */
  sizeQty: Record<string, number>;
}

interface POApiLine {
  supplierId: string;
  name: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  qty: number;
  price: number;
}

interface POPayload {
  requestId: string;
  expected: string;
  lines: POApiLine[];
}

const newLine = (): POLine => ({
  name: "",
  supplierId: "",
  color: "",
  sku: null,
  colorOptions: [],
  sizeQty: {},
});

const lineUnits = (l: POLine) =>
  Object.values(l.sizeQty).reduce((s, q) => s + (Number(q) || 0), 0);

export function PurchaseOrderForm({
  pending,
  onSubmit,
  initialProduct,
}: {
  pending?: boolean;
  onSubmit: (payload: POPayload) => void;
  initialProduct?: { name: string; price: number; colors: ColorOption[] };
}) {
  const request = React.useRef<{ key: string; id: string } | null>(null);
  type SourceSupplier = { id: string; name: string; prices: { color: string; size: string; price: number; currency: string }[] };
  type Sources = { articles: { name: string; suppliers: SourceSupplier[] }[] };
  const [sources, setSources] = React.useState<Sources>({ articles: [] });
  const [sourceError, setSourceError] = React.useState("");
  const [sourceLoading, setSourceLoading] = React.useState(false);
  const [expected, setExpected] = React.useState("");
  const [colors, setColors] = React.useState<ColorOption[]>([]);
  const [sizes, setSizes] = React.useState<string[]>([]);
  const [lines, setLines] = React.useState<POLine[]>([{ ...newLine(),
    name: initialProduct?.name ?? "",
    colorOptions: initialProduct?.colors ?? [], color: initialProduct?.colors[0]?.name ?? "" }]);
  const [error, setError] = React.useState<string | null>(null);
  const articleKey = JSON.stringify(Array.from(new Set(lines.map(l => l.name.trim()).filter(Boolean))).sort());
  React.useEffect(() => {
    if (!USE_BACKEND) return;
    let cancelled = false;
    setSourceLoading(true); setSourceError("");
    const names: string[] = JSON.parse(articleKey);
    if (!names.length) { setSources({ articles: [] }); setSourceLoading(false); return; }
    const query = new URLSearchParams(); names.forEach(name => query.append("articles", name));
    apiGet<Sources>(`/procurement/sourcing?${query}`).then(data => { if (!cancelled) setSources(data); })
      .catch(e => { if (!cancelled) { setSources({ articles: [] }); setSourceError(e instanceof Error ? e.message : "Could not load Catalog suppliers"); } })
      .finally(() => { if (!cancelled) setSourceLoading(false); });
    return () => { cancelled = true; };
  }, [articleKey]);
  const suppliersFor = (line: POLine) => sources.articles.find(a => a.name === line.name.trim())?.suppliers.filter(s => s.prices.length) ?? [];
  const priceFor = (line: POLine, size: string): number | null => sources.articles.find(a => a.name === line.name.trim())?.suppliers
    .find(s => s.id === line.supplierId)?.prices.find(p => p.color === line.color && p.size === size)?.price ?? null;
  const displayedPrice = (line: POLine) => {
    const values = Array.from(new Set(sizes.map(size => priceFor(line, size)).filter(p => p !== null)));
    return values.length === 1 ? values[0] : null;
  };

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
  // Supplier prices are loaded separately from saved article agreements.
  const pickProduct = (i: number, s: Suggestion) => {
    const opts = s.colors ?? [];
    setLines((ls) =>
      ls.map((l, j) =>
        j === i
          ? {
              ...l,
              name: s.name,
              supplierId: "", sizeQty: {},
              sku: null,
              colorOptions: opts,
              color: opts.some((c) => c.name === l.color) ? l.color : "",
            }
          : l
      )
    );
  };

  const grand = lines.reduce((sum, l) => sum + sizes.reduce((subtotal, size) => subtotal + (l.sizeQty[size] || 0) * (priceFor(l, size) ?? 0), 0), 0);
  const supplierGroups = new Map<string, { name: string; units: number; total: number }>();
  for (const line of lines) {
    const supplier = suppliersFor(line).find(s => s.id === line.supplierId);
    if (!supplier || !lineUnits(line)) continue;
    const group = supplierGroups.get(supplier.id) ?? { name: supplier.name, units: 0, total: 0 };
    group.units += lineUnits(line);
    group.total += sizes.reduce((sum, size) => sum + (line.sizeQty[size] || 0) * (priceFor(line, size) ?? 0), 0);
    supplierGroups.set(supplier.id, group);
  }

  const submit = () => {
    if (sourceLoading || sourceError) return setError("Wait for the saved Catalog suppliers to load.");
    if (!expected.trim()) return setError("Expected date is required.");
    const apiLines: POApiLine[] = [];
    for (const l of lines) {
      if (!l.name.trim()) continue;
      if (!suppliersFor(l).some(s => s.id === l.supplierId)) return setError(`Choose a saved Catalog supplier for ${l.name}.`);
      if (!lineUnits(l)) return setError(`Enter a quantity for ${l.name}, or remove its item row.`);
      for (const size of sizes) {
        const q = Math.floor(Number(l.sizeQty[size]) || 0);
        if (q > 0) {
          const agreed = priceFor(l, size);
          if (agreed === null) return setError(`Save a Catalog price for ${l.name} / ${l.color} / ${size} and the selected supplier first.`);
          apiLines.push({
            supplierId: l.supplierId,
            name: l.name.trim(),
            color: l.color.trim() || null,
            size,
            sku: null,
            qty: q,
            price: agreed,
          });
        }
      }
    }
    if (apiLines.length === 0)
      return setError("Add at least one item and enter a quantity for one or more sizes.");
    setError(null);
    const body = { expected: expected.trim(), lines: apiLines };
    const key = JSON.stringify(body);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    onSubmit({ requestId: request.current.id, ...body });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="erp-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-6">
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">Choose a supplier for each article. A separate PO is created for each supplier; articles from the same supplier stay together for production and shipment.</p>
        {sourceError && <p className="text-sm text-destructive">{sourceError}</p>}

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
                      onChange={(v) => patch(i, { name: v, supplierId: "", sizeQty: {}, color: "", colorOptions: [] })}
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

                  <label className="mt-3 block text-sm font-medium" htmlFor={`po-item-supplier-${i}`}>Supplier<span className="ml-1 text-brand-orange">*</span>
                    <select id={`po-item-supplier-${i}`} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={suppliersFor(l).some(s => s.id === l.supplierId) ? l.supplierId : ""}
                      disabled={!l.name.trim() || sourceLoading || pending} onChange={e => patch(i, { supplierId: e.target.value })}>
                      <option value="">{sourceLoading ? "Loading suppliers…" : "Select this article's supplier"}</option>
                      {suppliersFor(l).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  {l.name && !sourceLoading && !suppliersFor(l).length && <p className="mt-1 text-xs text-amber-700">Add this article's supplier and prices in Catalog → article → Pricing first.</p>}

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
                        Supplier price (€)
                      </span>
                      <Input
                        type="text"
                        placeholder={l.supplierId ? "See prices by size" : "Select supplier"}
                        value={displayedPrice(l) === null ? "" : money(displayedPrice(l)!)}
                        readOnly
                        title="Saved supplier price from Catalog. Prices can vary by size."
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
                            {l.supplierId && l.color && <span className="block text-center text-[9px] text-muted-foreground">{priceFor(l, s) === null ? "Not supplied" : money(priceFor(l, s)!)}</span>}
                            <input
                              type="number"
                              min={0}
                              step={1}
                              disabled={pending || ((!l.supplierId || priceFor(l, s) === null) && !(l.sizeQty[s] > 0))}
                              placeholder="0"
                              value={zeroToBlank(l.sizeQty[s] ?? 0)}
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
                      {money(sizes.reduce((sum, size) => sum + (l.sizeQty[size] || 0) * (priceFor(l, size) ?? 0), 0))}
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
          <span className="text-[13px] font-semibold text-muted-foreground">Total · {supplierGroups.size} supplier PO(s)</span>
          <span className="text-[18px] font-extrabold tabular text-foreground">{money(grand)}</span>
        </div>
        {Array.from(supplierGroups.entries()).map(([id, group]) => <div key={id} className="flex justify-between gap-3 text-sm"><span>{group.name} · {group.units} units · 1 PO / shipment group</span><b>{money(group.total)}</b></div>)}

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
          {pending ? "Saving…" : supplierGroups.size > 1 ? `Create ${supplierGroups.size} POs` : "Create PO"}
        </Button>
      </SheetFooter>
    </div>
  );
}
