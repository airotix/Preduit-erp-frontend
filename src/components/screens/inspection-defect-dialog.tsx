"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface NewInspectionDefect { name: string; category: string; severity: string }

export function InspectionDefectDialog({ name, open, onOpenChange, onSave }: {
  name: string; open: boolean; onOpenChange: (open: boolean) => void;
  onSave: (details: NewInspectionDefect) => Promise<void>;
}) {
  const [details, setDetails] = React.useState<NewInspectionDefect>({ name, category: "", severity: "Major" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (open) { setDetails({ name, category: "", severity: "Major" }); setError(null); }
  }, [open, name]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.name.trim() || !details.category.trim()) { setError("Name and category are required."); return; }
    setSaving(true); setError(null);
    try { await onSave({ ...details, name: details.name.trim(), category: details.category.trim() }); onOpenChange(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not create and add this defect."); }
    finally { setSaving(false); }
  };
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-6 shadow-xl">
        <Dialog.Title className="text-lg font-bold">Create defect type</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-muted-foreground">This defect is not saved yet. Enter its details to save it and add it to this inspection.</Dialog.Description>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="new-defect-name">Defect name</Label><Input id="new-defect-name" maxLength={120} required disabled={saving} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="new-defect-category">Category</Label><Input id="new-defect-category" maxLength={40} required disabled={saving} placeholder="e.g. Stitching" value={details.category} onChange={(e) => setDetails({ ...details, category: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="new-defect-severity">Severity</Label><select id="new-defect-severity" disabled={saving} className="w-full rounded-md border bg-background p-2 text-sm" value={details.severity} onChange={(e) => setDetails({ ...details, severity: e.target.value })}>{["Critical", "Major", "Minor"].map((s) => <option key={s}>{s}</option>)}</select></div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create and add defect"}</Button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
