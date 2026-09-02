"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { ProductNameInput, type Suggestion } from "@/components/screens/order-form";

interface ColorOption { name: string; hex: string }
interface LocationOption { name: string; kind: string }

interface Line {
  name: string;
  color: string;
  sku: string | null;
  colorOptions: ColorOption[];
  sizeQty: Record<string, number>;
}
interface ApiLine { name: string; color: string | null; size: string | null; sku: string | null; qty: number }
interface ReceiptPayload { location: string; lines: ApiLine[] }

const newLine = (): Line => ({ name: "", color: "", sku: null, colorOptions: [], sizeQty: {} });
const lineUnits = (l: Line) => Object.values(l.sizeQty).reduce((s, q) => s + (Number(q) || 0), 0);

export function StockReceiptForm({
  pending,
  onSubmit,
}: {
  pending?: boolean;
  onSubmit: (payload: ReceiptPayload) => void;
}) {
  const [location, setLocation] = React.useState("");
  const [locations, setLocations] = React.useState<LocationOption[]>([]);
  const [colors, setColors] = React.useState<ColorOption[]>([]);
  const [sizes, setSizes] = React.useState<string[]>([]);
  const [lines, setLines] = React.useState<Line[]>([newLine()]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!USE_BACKEND) return;
    apiGet<LocationOption[]>("/inventory/locations/options").then(setLocations).catch(() => setLocations([]));
    apiGet<ColorOption[]>("/catalog/colors").then(setColors).catch(() => setColors([]));
    apiGet<string[]>("/catalog/sizes").then(setSizes).catch(() => setSizes([]));
  }, []);

  const patch = (i: number, next: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...next } : l)));
  const setSize = (i: number, size: string, val: number) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, sizeQty: { ...l.sizeQty, [size]: val } } : l)));
  const addLine = () => setLines((ls) => [...ls, newLine()]);
  const removeLine = (i: number) => setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, j) => j !== i)));

  const pickProduct = (i: number, s: Suggestion) => {
    const opts = s.colors ?? [];
    setLines((ls) =>
      ls.map((l, j) =>
        j === i
          ? { ...l, name: s.name, sku: null, colorOptions: opts,
              color: opts.some((c) => c.name === l.color) ? l.color : "" }
          : l
      )
    );
  };

  const grand = lines.reduce((s, l) => s + lineUnits(l), 0);

  const submit = () => {
    if (!location.trim()) return setError("Location is required.");
    const apiLines: ApiLine[] = [];
    for (const l of lines) {
      if (!l.name.trim()) continue;
      for (const size of sizes) {
        const q = Math.floor(Number(l.sizeQty[size]) || 0);
        if (q > 0) apiLines.push({ name: l.name.trim(), color: l.color.trim() || null, size, sku: null, qty: q });
      }
    }
    if (apiLines.length === 0)
      return setError("Add at least one item and a quantity for one or more sizes.");
    setError(null);
    onSubmit({ location: location.trim(), lines: apiLines });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="erp-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-6">
        <div className="space-y-1.5">
          <Label>Location<span className="ml-0.5 text-brand-orange">*</span></Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger><SelectValue placeholder="Receive into location" /></SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.name} value={l.name}>{l.name}{l.kind ? ` · ${l.kind}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Items<span className="ml-0.5 text-brand-orange">*</span></Label>
          <div className="space-y-3">
            {lines.map((l, i) => {
              const opts = l.colorOptions.length ? l.colorOptions : colors;
              const colorHint = l.name && !l.colorOptions.length ? "No colors for item" : "Color";
              const units = lineUnits(l);
              return (
                <div key={i} className="rounded-xl border border-border/60 p-3">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <ProductNameInput
                      value={l.name}
                      onChange={(v) => patch(i, { name: v })}
                      onPick={(s) => pickProduct(i, s)}
                      endpoint="/inventory/stock/search"
                    />
                    <button type="button" onClick={() => removeLine(i)} aria-label="Remove item"
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 disabled:opacity-40"
                      disabled={lines.length === 1}>
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>

                  <div className="mt-2 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">Color</span>
                    <Select value={l.color} onValueChange={(v) => patch(i, { color: v })}>
                      <SelectTrigger><SelectValue placeholder={colorHint} /></SelectTrigger>
                      <SelectContent>
                        {opts.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: c.hex }} />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">Size breakdown</span>
                    {sizes.length === 0 ? (
                      <p className="mt-1 text-[12px] text-muted-foreground">No sizes in the catalog yet.</p>
                    ) : (
                      <div className="mt-1.5 grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                        {sizes.map((s) => (
                          <div key={s} className="space-y-0.5">
                            <span className="block text-center text-[10px] font-bold uppercase text-muted-foreground">{s}</span>
                            <input type="number" min={0} value={l.sizeQty[s] ?? 0}
                              onChange={(e) => setSize(i, s, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                              className="w-full rounded-lg border border-border/60 py-1.5 text-center text-[13px] font-bold tabular outline-none focus:border-primary" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[13px]">
                    <span className="text-muted-foreground">{units.toLocaleString()} unit{units === 1 ? "" : "s"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addLine}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
            <Plus size={15} strokeWidth={2.5} /> Add item
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-[13px] font-semibold text-muted-foreground">Units received</span>
          <span className="text-[18px] font-extrabold tabular text-foreground">{grand.toLocaleString()}</span>
        </div>

        {error && <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>}
      </div>

      <SheetFooter>
        <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Receive stock"}
        </Button>
      </SheetFooter>
    </div>
  );
}
