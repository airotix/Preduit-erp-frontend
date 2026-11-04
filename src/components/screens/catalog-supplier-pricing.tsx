"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";

type Variant = { id: string; color: string; size: string };
type Supplier = { id: string; name: string; active: boolean;
  prices: Record<string, { price: string; currency: string; active: boolean }> };
type Data = { variants: Variant[]; suppliers: Supplier[]; options: { id: string; name: string }[] };
type Color = { name: string; hex: string };
const cellKey = (color: string, size: string) => JSON.stringify([color, size]);
const normalizePrice = (value: string) => value.replace(/^0+(?=\d)/, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");

function SupplierPriceMatrix({ supplier, variants, sizes, colors, canWrite, draft, onCancel, onSave }: {
  supplier: Supplier; variants: Variant[]; sizes: string[]; colors: Color[];
  canWrite: boolean; draft: boolean; onCancel: () => void;
  onSave: (supplierId: string, active: boolean, prices: { variantId: string; price: string | null }[]) => Promise<void>;
}) {
  const groups = new Map<string, Variant[]>();
  for (const variant of variants) {
    const key = cellKey(variant.color, variant.size);
    groups.set(key, [...(groups.get(key) ?? []), variant]);
  }
  const saved: Record<string, string> = {};
  const conflicts: string[] = [];
  for (const [key, group] of groups) {
    const values = [...new Set(group.map(v => supplier.prices[v.id]?.price).filter((v): v is string => !!v).map(normalizePrice))];
    saved[key] = values.length === 1 ? values[0] : "";
    if (values.length > 1) conflicts.push(key);
  }
  const signature = JSON.stringify({ saved, active: supplier.active });
  const [values, setValues] = React.useState(saved);
  const [active, setActive] = React.useState(supplier.active);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const dirty = React.useRef(false);
  // Saving another supplier must not overwrite this card's unfinished prices.
  React.useEffect(() => {
    if (!dirty.current) {
      const snapshot = JSON.parse(signature) as { saved: Record<string, string>; active: boolean };
      setValues(snapshot.saved); setActive(snapshot.active);
    }
  }, [signature]);
  const visible = new Set(colors.flatMap(color => sizes.map(size => cellKey(color.name, size))));
  const matrixChanged = variants.some(v => !visible.has(cellKey(v.color, v.size)));
  const [bulk, setBulk] = React.useState("");
  const applyAll = () => {
    const price = bulk.trim();
    if (!price || Number(price) <= 0) return;
    dirty.current = true; setNotice(""); setError("");
    setValues(Object.fromEntries([...groups.keys()].map(key => [key, price])));
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canWrite || busy) return;
    setError(""); setNotice("");
    if (matrixChanged) return setError("The article's colours or sizes changed. Refresh the article before saving.");
    if (conflicts.some(key => !values[key]?.trim())) return setError("Enter one price in each highlighted cell to resolve its conflicting saved prices.");
    setBusy(true);
    try {
      await onSave(supplier.id, active, variants.map(v => ({ variantId: v.id, price: values[cellKey(v.color, v.size)]?.trim() || null })));
      dirty.current = false; setNotice("Prices saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save supplier prices."); }
    finally { setBusy(false); }
  };
  return <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-background p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h4 className="font-bold">{supplier.name}</h4><p className="mt-1 text-xs text-muted-foreground">Purchase prices in EUR{draft ? " · Not saved yet" : ""}</p></div>
      {draft ? <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Remove</Button> :
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} disabled={!canWrite || busy}
          onChange={e => { dirty.current = true; setActive(e.target.checked); setNotice(""); }} />Available for new POs</label>}
    </div>
    {canWrite && <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm font-medium">Same price for all colours and sizes
        <input type="number" min="0.0001" step="0.0001" data-wheel-step="1" aria-label={`${supplier.name}: price for all colours and sizes, in EUR`}
          className="mt-1 block w-32 rounded-md border border-border bg-background px-2 py-2 text-right tabular" placeholder="e.g. 25"
          value={bulk} disabled={busy} onChange={e => setBulk(e.target.value)} /></label>
      <Button type="button" variant="outline" disabled={busy || !bulk.trim() || Number(bulk) <= 0} onClick={applyAll}>Apply to all</Button>
    </div>}
    <Table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="sticky left-0 z-10 bg-background px-3 py-2 text-left">Colour / Size</th>
      {sizes.map(size => <th key={size} className="min-w-24 px-2 py-2 text-center">{size}</th>)}</tr></thead>
      <tbody>{colors.map(color => <tr key={color.name} className="border-b border-border last:border-0">
        <th scope="row" className="sticky left-0 z-10 bg-background px-3 py-3 text-left"><span className="flex items-center gap-2 whitespace-nowrap"><span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ background: color.hex }} />{color.name}</span></th>
        {sizes.map(size => {
          const key = cellKey(color.name, size), group = groups.get(key);
          return <td key={size} className="px-2 py-2 text-center">{group ? <input type="number" min="0.0001" step="0.0001" data-wheel-step="1"
            aria-label={`${supplier.name}: ${color.name}, ${size}, price in EUR`}
            className={`w-24 rounded-md border bg-background px-2 py-2 text-right tabular ${conflicts.includes(key) && !values[key]?.trim() ? "border-amber-500" : "border-border"}`}
            placeholder={conflicts.includes(key) ? "Set price" : "—"} value={values[key] ?? ""} disabled={!canWrite || busy}
            onChange={e => { dirty.current = true; setValues(previous => ({ ...previous, [key]: e.target.value })); setNotice(""); setError(""); }} />
            : <span className="text-muted-foreground" title="This colour and size is not configured for this article">—</span>}</td>;
        })}</tr>)}</tbody>
    </Table>
    {matrixChanged && <p role="alert" className="text-sm text-amber-700">The article matrix changed. Refresh the article to load its current colours and sizes.</p>}
    {!!conflicts.length && <p className="text-xs text-amber-700">Some saved prices differ for the same colour and size. Enter a single price in the highlighted cells.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
    {canWrite && <div className="flex justify-end"><Button disabled={busy || matrixChanged || !variants.length}>{busy ? "Saving…" : `Save prices for ${supplier.name}`}</Button></div>}
  </form>;
}

export function CatalogSupplierPricing({ productId, sizes, colors, onSaved }: {
  productId: string; sizes: string[]; colors: Color[]; onSaved?: () => void;
}) {
  const access = useModuleAccess("catalog"), procurement = useModuleAccess("procurement");
  const client = useQueryClient();
  const key = ["catalog-supplier-prices", productId];
  const q = useQuery({ queryKey: key, queryFn: () => apiGet<Data>(`/catalog/products/${productId}/supplier-prices`) });
  const [supplierId, setSupplierId] = React.useState("");
  const [drafts, setDrafts] = React.useState<Supplier[]>([]);
  const suppliers = [...(q.data?.suppliers ?? []), ...drafts.filter(d => !q.data?.suppliers.some(s => s.id === d.id))];
  const options = q.data?.options.filter(option => !suppliers.some(s => s.id === option.id)) ?? [];
  const add = () => {
    const supplier = options.find(s => s.id === supplierId);
    if (!supplier || !access.canWrite) return;
    setDrafts(previous => [...previous, { ...supplier, active: true, prices: {} }]); setSupplierId("");
  };
  const save = async (id: string, active: boolean, prices: { variantId: string; price: string | null }[]) => {
    await client.cancelQueries({ queryKey: key, exact: true });
    const data = await apiPost<Data>(`/catalog/products/${productId}/supplier-prices`, { supplierId: id, active, prices });
    // Each card owns one supplier; out-of-order responses must not replace
    // another supplier's more recent save with an older response snapshot.
    client.setQueryData<Data>(key, previous => ({ ...data, suppliers: [
      ...(previous?.suppliers ?? data.suppliers).filter(s => s.id !== id),
      ...data.suppliers.filter(s => s.id === id),
    ] }));
    setDrafts(previous => previous.filter(s => s.id !== id));
    void client.invalidateQueries({ predicate: query => query.queryKey[0] !== "catalog-supplier-prices" });
    onSaved?.();
  };
  return <section className="space-y-4">
    <div><h3 className="font-bold">Suppliers & purchase prices</h3><p className="mt-1 text-sm text-muted-foreground">Add a supplier, enter its price for each colour and size, then save that supplier's chart. Leave a price blank if that supplier does not supply the combination.</p></div>
    {q.isPending && <p className="text-sm">Loading suppliers…</p>}
    {q.isError && <p role="alert" className="text-sm text-destructive">Could not load supplier prices. <button className="underline" type="button" onClick={() => q.refetch()}>Retry</button></p>}
    {q.data && <>
      {access.canWrite && <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-4">
        <label className="min-w-48 flex-1 text-sm font-medium" htmlFor={`add-article-supplier-${productId}`}>Supplier from Procurement
          <select id={`add-article-supplier-${productId}`} value={supplierId} onChange={e => setSupplierId(e.target.value)}
            disabled={!options.length || !q.data.variants.length} className="mt-1 w-full rounded-md border border-border bg-background p-2">
            <option value="">{options.length ? "Select supplier" : suppliers.length ? "All available suppliers added" : "No suppliers available"}</option>
            {options.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label><Button type="button" disabled={!supplierId || !q.data.variants.length} onClick={add}>Add supplier</Button>
        {procurement.canRead && <Link href="/procurement/suppliers" target="_blank" rel="noopener noreferrer" className="pb-2 text-sm underline">Manage suppliers ↗</Link>}
        <button type="button" disabled={q.isFetching} className="pb-2 text-sm underline disabled:opacity-50" onClick={() => q.refetch()}>Refresh list</button>
      </div>}
      {!q.data.variants.length ? <p className="text-sm text-muted-foreground">Save this article's colours and sizes before adding supplier prices.</p> :
        !suppliers.length && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No suppliers added to this article yet.</p>}
      {!q.data.options.length && <p className="text-sm text-muted-foreground">Create the supplier in Procurement → Suppliers first, then refresh the list.</p>}
      {suppliers.map(supplier => <SupplierPriceMatrix key={`${productId}-${supplier.id}`} supplier={supplier} variants={q.data!.variants}
        colors={colors} sizes={sizes} canWrite={access.canWrite} draft={!q.data!.suppliers.some(s => s.id === supplier.id)}
        onCancel={() => setDrafts(previous => previous.filter(s => s.id !== supplier.id))} onSave={save} />)}
    </>}
  </section>;
}
