"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";

type Movement = { id: string; receiptId: string; kind: string; reference: string; reason: string;
  actor: string | null; article: string | null; sku: string | null; color: string | null; size: string | null;
  location: string | null; quantity: number; delta: number; before: number; after: number; createdAt: string;
  source: { module: string | null; type: string | null; reference: string; href: string | null };
  batchId: string | null; movementHref: string };
type History = { entries: Movement[]; total: number; kinds: string[];
  variants: { id: string; sku: string }[]; locations: { id: string; name: string }[] };
const emptyFilters = { search: "", variant: "", location: "", kind: "", from: "", to: "" };
const control = "rounded-md border border-border/70 bg-background px-2 py-1.5 text-sm";

function SourceRecord({ entry }: { entry: Movement }) {
  const { canRead } = useModuleAccess(entry.source.module || "inventory");
  return <div className="space-y-1">
    <Link className="font-semibold underline" href={entry.movementHref}>{entry.source.reference || entry.reference}</Link>
    {canRead && entry.source.href && <Link className="block text-xs text-primary underline" href={entry.source.href}>Open source record</Link>}
    {entry.batchId && <Link className="block text-xs text-primary underline" href={`/inventory/batches/${entry.batchId}`}>Open batch</Link>}
    {entry.reference !== entry.source.reference && <span className="block text-xs">{entry.reference}</span>}
  </div>;
}

export function StockMovementHistory({ productId, requestId }: { productId?: string; requestId?: string }) {
  const { canRead } = useModuleAccess("inventory");
  const [filters, setFilters] = React.useState(emptyFilters);
  const [applied, setApplied] = React.useState(emptyFilters);
  const [offset, setOffset] = React.useState(0);
  const path = React.useMemo(() => {
    const query = new URLSearchParams({ limit: "25", offset: String(offset) });
    if (productId) query.set("productId", productId);
    if (requestId) query.set("requestId", requestId);
    if (applied.search.trim()) query.set("search", applied.search.trim());
    if (applied.variant) query.set("variantId", applied.variant);
    if (applied.location) query.set("locationId", applied.location);
    if (applied.kind) query.set("kind", applied.kind);
    if (applied.from) query.set("fromAt", new Date(`${applied.from}T00:00:00`).toISOString());
    if (applied.to) {
      const nextDay = new Date(`${applied.to}T00:00:00`); nextDay.setDate(nextDay.getDate() + 1);
      query.set("toAt", nextDay.toISOString());
    }
    return `/inventory/movements?${query}`;
  }, [productId, requestId, applied, offset]);
  const { data, isLoading, error } = useQuery<History>({
    queryKey: ["inventory", "movements", path], queryFn: () => apiGet<History>(path), enabled: USE_BACKEND && canRead,
  });
  React.useEffect(() => {
    if (data && offset > 0 && offset >= data.total) setOffset(Math.max(0, (Math.ceil(data.total / 25) - 1) * 25));
  }, [data, offset]);
  const set = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  if (!canRead) return <p role="alert">Your role cannot read Inventory movements.</p>;
  return <section className="space-y-4 rounded-xl border border-border/60 bg-background p-4">
    <div><h2 className="font-semibold">Stock movement history</h2>
      <p className="mt-1 text-sm text-muted-foreground">Receipts, transfers, dispatches, count corrections, returns, and write-offs. Balances are shown for each variant at its location.</p>
      <p className="mt-1 text-xs text-muted-foreground">Opening balances mark when the complete ledger started. Earlier recorded history may be incomplete. Returns held for QC do not increase warehouse stock.</p></div>
    <form onSubmit={(event) => { event.preventDefault(); setApplied({ ...filters }); setOffset(0); }} className="flex flex-wrap items-end gap-3">
      <label className="space-y-1 text-xs"><span className="block">Search</span>
        <input value={filters.search} maxLength={200} onChange={(event) => set("search", event.target.value)}
          placeholder="SKU, article, reference, user…" className={control} /></label>
      <label className="space-y-1 text-xs"><span className="block">Variant</span>
        <select className={`${control} max-w-48`} value={filters.variant} onChange={(event) => set("variant", event.target.value)}>
          <option value="">All variants</option>{data?.variants.map((v) => <option key={v.id} value={v.id}>{v.sku}</option>)}
        </select></label>
      <label className="space-y-1 text-xs"><span className="block">Location</span>
        <select className={control} value={filters.location} onChange={(event) => set("location", event.target.value)}>
          <option value="">All locations</option>{data?.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
        </select></label>
      <label className="space-y-1 text-xs"><span className="block">Type</span>
        <select className={control} value={filters.kind} onChange={(event) => set("kind", event.target.value)}>
          <option value="">All types</option>{data?.kinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
        </select></label>
      <label className="space-y-1 text-xs"><span className="block">From</span>
        <input type="date" className={control} value={filters.from} max={filters.to || undefined} onChange={(event) => set("from", event.target.value)} /></label>
      <label className="space-y-1 text-xs"><span className="block">Through</span>
        <input type="date" className={control} value={filters.to} min={filters.from || undefined} onChange={(event) => set("to", event.target.value)} /></label>
      <button type="submit" className="rounded-md bg-[#23263A] px-3 py-2 text-sm font-semibold text-white">Apply filters</button>
      <button type="button" className="text-sm underline" onClick={() => { setFilters(emptyFilters); setApplied(emptyFilters); setOffset(0); }}>Clear</button>
    </form>
    {isLoading ? <p>Loading movements…</p> : error ? <p role="alert" className="text-sm text-destructive">{error.message}</p> :
      !data?.entries.length ? <p className="text-sm text-muted-foreground">No stock movements match these filters.</p> :
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr className="text-xs text-muted-foreground">
          <th className="pb-2">Date / user</th><th>Type</th><th>Article / variant</th><th>Location</th><th>Source / reason</th>
          <th className="text-right">Units</th><th className="text-right">Change</th><th className="text-right">Before</th><th className="text-right">After</th>
        </tr></thead>
        <tbody>{data.entries.map((entry) => <tr key={entry.id} className="border-t border-border/50 align-top">
          <td className="whitespace-nowrap py-3 pr-3">{new Date(entry.createdAt).toLocaleString()}<span className="block text-xs text-muted-foreground">{entry.actor || "User not recorded"}</span></td>
          <td className="py-3 pr-3">{entry.kind}</td>
          <td className="py-3 pr-3"><span className="font-semibold">{entry.article || "—"}</span>
            <span className="block">{entry.color || "—"} · {entry.size || "—"}</span><span className="block text-xs text-muted-foreground">{entry.sku}</span></td>
          <td className="py-3 pr-3">{entry.location}</td>
          <td className="min-w-48 py-3 pr-3"><SourceRecord entry={entry} /><span className="mt-1 block text-xs text-muted-foreground">{entry.reason}</span></td>
          <td className="py-3 pl-3 text-right tabular-nums">{entry.quantity}</td>
          <td className="py-3 pl-3 text-right tabular-nums">{entry.delta > 0 ? "+" : ""}{entry.delta}</td>
          <td className="py-3 pl-3 text-right tabular-nums">{entry.before}</td><td className="py-3 pl-3 text-right tabular-nums">{entry.after}</td>
        </tr>)}</tbody>
      </table></div>}
    {data && data.total > 0 && <div className="flex items-center justify-between text-sm">
      <span>{offset + 1}–{Math.min(offset + 25, data.total)} of {data.total}</span>
      <div className="flex gap-4"><button disabled={!offset} className="disabled:opacity-40" onClick={() => setOffset(Math.max(0, offset - 25))}>Previous</button>
        <button disabled={offset + 25 >= data.total} className="disabled:opacity-40" onClick={() => setOffset(offset + 25)}>Next</button></div>
    </div>}
  </section>;
}
