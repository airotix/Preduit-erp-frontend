"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { apiGet, USE_BACKEND } from "@/lib/api-client";

interface OrderItem { item: string; qty: number }
interface InspectionPayload {
  order: string; item: string | null; stage: string; inspectionType: string;
  aql: string; inspector: string; batchLot: string;
}

const STAGES = ["Pre-Production", "Inline", "During Production", "Final", "Pre-Shipment"];
const TYPES = ["First Article", "In-line", "Final QC", "Pre-Shipment"];
const AQLS = ["1.0", "1.5", "2.5", "4.0", "6.5"];

/** New inspection form. Picking an order loads its production items so an
 *  inspection can target a specific item (like the automatic per-item flow);
 *  leaving Item blank inspects the whole order. */
export function InspectionForm({
  pending, onSubmit,
}: {
  pending?: boolean;
  onSubmit: (payload: InspectionPayload) => void;
}) {
  const [order, setOrder] = React.useState("");
  const [item, setItem] = React.useState("");          // "" = whole order
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [stage, setStage] = React.useState("Final");
  const [inspectionType, setInspectionType] = React.useState("Final QC");
  const [aql, setAql] = React.useState("2.5");
  const [inspector, setInspector] = React.useState("");
  const [batchLot, setBatchLot] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const loadItems = React.useCallback((ref: string) => {
    if (!USE_BACKEND || !ref.trim()) { setItems([]); return; }
    setLoadingItems(true);
    apiGet<{ items: OrderItem[] }>(`/quality/order-items?order=${encodeURIComponent(ref.trim())}`)
      .then((r) => setItems(r.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  const submit = () => {
    if (!order.trim()) { setError("Order reference is required."); return; }
    setError(null);
    onSubmit({
      order: order.trim(), item: item || null, stage, inspectionType,
      aql, inspector: inspector.trim(), batchLot: batchLot.trim(),
    });
  };

  return (
    <div className="flex-1 space-y-4 px-6 pb-6">
      <div className="space-y-1.5">
        <Label htmlFor="order">Production order *</Label>
        <Input id="order" value={order} placeholder="e.g. MO-3323"
          onChange={(e) => setOrder(e.target.value)}
          onBlur={(e) => loadItems(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Item</Label>
        <Select value={item || "__all__"} onValueChange={(v) => setItem(v === "__all__" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder={loadingItems ? "Loading items…" : "Whole order"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Whole order</SelectItem>
            {items.map((it) => (
              <SelectItem key={it.item} value={it.item}>{it.item} · {it.qty} units</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-muted-foreground">
          {items.length
            ? "Pick an item to inspect it independently, or leave as “Whole order”."
            : "Enter the order above to load its items."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Inspection type</Label>
          <Select value={inspectionType} onValueChange={setInspectionType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>AQL level</Label>
          <Select value={aql} onValueChange={setAql}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{AQLS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="batch">Batch / Lot</Label>
          <Input id="batch" value={batchLot} onChange={(e) => setBatchLot(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inspector">Inspector</Label>
        <Input id="inspector" value={inspector} onChange={(e) => setInspector(e.target.value)} />
      </div>

      {error && <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>}

      <SheetFooter>
        <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Creating…" : "Create inspection"}
        </Button>
      </SheetFooter>
    </div>
  );
}
