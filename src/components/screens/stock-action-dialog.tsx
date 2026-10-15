"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

type Balance = { variantId: number; variantPublicId: string; sku: string; color: string; size: string;
  locations: { name: string; onHand: number; reserved: number }[] };
type Location = { id: string; name: string; kind: string };

export function StockActionDialog({ productId, productTitle, color, size, onSaved, children }: {
  productId: string; productTitle: string; color: string; size: string; onSaved: () => void;
  children: React.ReactNode;
}) {
  const { canWrite, reason: writeReason } = useModuleAccess("inventory");
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [variant, setVariant] = React.useState<Balance | null>(null);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [mode, setMode] = React.useState<"receipt" | "adjustment">("receipt");
  const [location, setLocation] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pending = React.useRef<{ key: string; id: string; saveId: string; submitId: string } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null); setVariant(null);
    Promise.all([
      apiGet<Balance[]>(`/inventory/stock/${productId}/balances`),
      apiGet<Location[]>("/inventory/locations/options"),
    ]).then(([balances, options]) => {
      setVariant(balances.find((v) => v.color.toLowerCase() === color.toLowerCase()
        && v.size.toLowerCase() === size.toLowerCase()) ?? null);
      setLocations(options);
      setLocation(options[0]?.name ?? "");
    }).catch((e) => setError(e instanceof Error ? e.message : "Could not load stock options."))
      .finally(() => setLoading(false));
  }, [open, productId, color, size]);

  const current = variant?.locations.find((l) => l.name === location);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!variant) return setError("Save this colour and size in Catalog first.");
    if (!location) return setError("Choose an inventory location.");
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < (mode === "receipt" ? 1 : 0))
      return setError(mode === "receipt" ? "Enter a positive whole number." : "Enter a count of zero or more.");
    if (reference.trim().length < 3 || reason.trim().length < 3)
      return setError("Enter a reference and reason of at least three characters each.");
    const body = mode === "receipt"
      ? { location, reference: reference.trim(), reason: reason.trim(),
          lines: [{ name: "", color, size, sku: variant.sku, qty }] }
      : { variantId: variant.variantId, location, countedQty: qty,
          reference: reference.trim(), reason: reason.trim() };
    if (mode === "receipt") (body as { lines: { name: string }[] }).lines[0].name = productTitle;
    const key = JSON.stringify(body);
    if (!pending.current || pending.current.key !== key) pending.current = { key, id: crypto.randomUUID(), saveId: crypto.randomUUID(), submitId: crypto.randomUUID() };
    setBusy(true); setError(null);
    try {
      if (mode === "receipt") {
        await apiPost("/inventory/stock", { ...body, requestId: pending.current.id });
      } else {
        const chosen = locations.find(l => l.name === location);
        if (!chosen || !user?.email) throw new Error("Choose a warehouse and sign in as a named counter.");
        const count = await apiPost<{ id: string; lines: { id: number }[] }>("/inventory/stocktakes", {
          locationId: chosen.id, variantIds: [variant.variantPublicId], counter: user.email,
          reference: reference.trim(), reason: reason.trim(), requestId: pending.current.id,
        });
        // Stable action UUIDs make retrying this dialog safe at every step.
        const { saveId, submitId } = pending.current;
        await apiPost(`/inventory/stocktakes/${count.id}/save`, { requestId: saveId, reason: reason.trim(),
          lines: [{ id: count.lines[0].id, quantity: qty }] });
        await apiPost(`/inventory/stocktakes/${count.id}/submit`, { requestId: submitId, reason: reason.trim() });
        router.push(`/inventory/stocktakes/${count.id}`);
      }
      pending.current = null;
      setOpen(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post the stock movement.");
    } finally { setBusy(false); }
  };
  const field = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
    <Dialog.Trigger asChild><button type="button" disabled={!canWrite} title={writeReason ?? `Record stock for ${color} / ${size}`}
      className="w-full rounded-lg border border-border/60 px-2 py-1.5 text-center font-bold tabular hover:border-primary disabled:cursor-not-allowed disabled:opacity-60">{children}</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl">
        <Dialog.Title className="text-lg font-bold">Record inventory movement</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-muted-foreground">{color} · {size}. Stock changes require a location, reference and reason.</Dialog.Description>
        {loading ? <p className="mt-5 text-sm">Loading stock…</p> : !variant ?
          <p className="mt-5 text-sm">Save this colour and size in Catalog before recording stock.</p> :
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">Action
              <select value={mode} onChange={(e) => { setMode(e.target.value as typeof mode); setQuantity(""); }} className={field} disabled={busy}>
                <option value="receipt">Receive stock</option><option value="adjustment">Correct counted stock</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">Location
              <select value={location} onChange={(e) => setLocation(e.target.value)} className={field} required disabled={busy}>
                <option value="">Select location</option>{locations.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">Current on hand at this location: <strong>{current?.onHand ?? 0}</strong>; reserved: <strong>{current?.reserved ?? 0}</strong></p>
            <label className="block text-sm font-semibold">{mode === "receipt" ? "Units received" : "Actual counted units"}
              <input type="number" min={mode === "receipt" ? 1 : 0} step={1} required value={quantity}
                onChange={(e) => setQuantity(e.target.value)} className={field} disabled={busy} />
            </label>
            <label className="block text-sm font-semibold">Reference
              <input required minLength={3} maxLength={80} value={reference} onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt, document or count ID" className={field} disabled={busy} />
            </label>
            <label className="block text-sm font-semibold">Reason
              <textarea required minLength={3} maxLength={400} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder={mode === "receipt" ? "Source of the received goods" : "Why the physical count differs"}
                className={field} disabled={busy} />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : mode === "receipt" ? "Post receipt" : "Submit count for review"}</Button></div>
          </form>}
        {!loading && !variant && <div className="mt-5 flex justify-end"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button></div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
