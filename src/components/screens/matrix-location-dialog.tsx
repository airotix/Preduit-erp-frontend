"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api-client";

/** Pause a matrix save, gather its location, and retry the same pending edits. */
export function useMatrixLocationSave() {
  const [open, setOpen] = React.useState(false);
  const [locations, setLocations] = React.useState<string[]>([]);
  const [mode, setMode] = React.useState<"existing" | "new">("new");
  const [selected, setSelected] = React.useState("");
  const [form, setForm] = React.useState({ name: "", code: "", type: "Warehouse", region: "", capacity: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pending = React.useRef<((location?: string) => Promise<void>) | null>(null);

  const saveWithLocation = async (save: (location?: string) => Promise<void>) => {
    try {
      await save();
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "Create an inventory location before adding stock.") throw err;
      pending.current = save;
      setError(null);
      setOpen(true);
      setBusy(true);
      try {
        const rows = await apiGet<{ name: string; kind: string }[]>("/inventory/locations/options");
        const options = rows.map((row) => row.name);
        setLocations(options);
        setSelected(options[0] ?? "");
        setMode(options.length ? "existing" : "new");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load inventory locations.");
      } finally {
        setBusy(false);
      }
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      let location = selected;
      if (mode === "new") {
        const created = await apiPost<{ name: string }>("/inventory/locations", {
          name: form.name.trim(), code: form.code.trim(), type: form.type, region: form.region.trim(),
          capacity: form.capacity === "" ? null : Number(form.capacity),
        });
        location = created.name;
        // If the matrix retry fails, keep the newly created location available.
        setLocations((ls) => ls.includes(location) ? ls : [...ls, location]);
        setSelected(location); setMode("existing");
      }
      if (!location) throw new Error("Choose a location to save the quantities.");
      await pending.current?.(location);
      pending.current = null;
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  };
  const fieldClass = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const locationDialog = (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold">Choose an inventory location</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            This article needs a location for its stock. Your colours, sizes and quantities are kept while you complete these details.
          </Dialog.Description>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {locations.length > 0 && <label className="block text-sm font-semibold">Location setup
              <select value={mode} onChange={(e) => setMode(e.target.value as "existing" | "new")} className={fieldClass} disabled={busy}>
                <option value="existing">Use an existing location</option><option value="new">Create a new location</option>
              </select>
            </label>}
            {mode === "existing" ? <label className="block text-sm font-semibold">Location
              <select required value={selected} onChange={(e) => setSelected(e.target.value)} className={fieldClass} disabled={busy}>
                <option value="">Select a location</option>{locations.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label> : <>
              {([ ["name", "Location name", 120], ["code", "Location code", 40], ["region", "Region", 80] ] as const).map(([key, label, max]) =>
                <label key={key} className="block text-sm font-semibold">{label}
                  <input required maxLength={max} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={fieldClass} disabled={busy} />
                </label>)}
              <label className="block text-sm font-semibold">Type
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={fieldClass} disabled={busy}>
                  <option value="Warehouse">Warehouse</option><option value="Retail">Retail</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">Capacity (optional)
                <input type="number" min={0} step={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className={fieldClass} disabled={busy} />
              </label>
            </>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save location & quantities"}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return { saveWithLocation, locationDialog };
}
