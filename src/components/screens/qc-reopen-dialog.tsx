"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";

export function QCReopenDialog({ inspectionId, open, onOpenChange, canReopenProduction, onSaved, correctiveAction }: {
  inspectionId: string; open: boolean; onOpenChange: (open: boolean) => void;
  canReopenProduction?: boolean; onSaved?: () => void;
  correctiveAction?: { assignedTo: string; dueDate: string; notes: string };
}) {
  const [mode, setMode] = React.useState<"inspection" | "production">("inspection");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [created, setCreated] = React.useState<{ publicId: string; inspectionNo: string; productionId: string | null } | null>(null);
  const access = useModuleAccess("production");
  const [details, setDetails] = React.useState({ assignedTo: "", dueDate: "", notes: "" });
  const initialAssigned = correctiveAction?.assignedTo ?? "";
  const initialDue = correctiveAction?.dueDate ?? "";
  const initialNotes = correctiveAction?.notes ?? "";
  React.useEffect(() => { if (open) { setMode("inspection"); setError(""); setCreated(null); setDetails({ assignedTo: initialAssigned, dueDate: initialDue, notes: initialNotes }); } }, [open, inspectionId, initialAssigned, initialDue, initialNotes]);
  const save = async () => {
    setBusy(true); setError("");
    try {
      setCreated(await apiPost(`/quality/inspections/${inspectionId}/reopen`, { mode,
        ...(correctiveAction || Object.values(details).some((value) => value.trim()) ? details : {}) }));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reopen inspection."); }
    finally { setBusy(false); }
  };
  const close = () => { if (created) onSaved?.(); onOpenChange(false); };
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!busy) { if (!value) close(); else onOpenChange(true); } }}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
        <Dialog.Title className="text-lg font-semibold">Inspection failed</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-muted-foreground">Choose what to reopen. Previous inspection and production records are retained.</Dialog.Description>
        {created ? <div className="mt-4 space-y-3 text-sm">
          <p>Created inspection <Link className="underline" href={`/quality/inspections/${created.publicId}`}>{created.inspectionNo}</Link>.</p>
          {mode === "production" && created.productionId && <p>Complete the reopened <Link className="underline" href={`/production/porders/${created.productionId}`}>production TNA</Link> before starting this inspection.</p>}
        </div> : <fieldset disabled={busy} className="mt-4 space-y-3">
          <label className="flex gap-3 rounded-lg border p-3 text-sm"><input type="radio" name="qc-recovery" checked={mode === "inspection"} onChange={() => setMode("inspection")} />
            <span><b>Reopen inspection only</b><br />Keep the completed TNA and perform a fresh inspection.</span></label>
          <label className="flex gap-3 rounded-lg border p-3 text-sm"><input type="radio" name="qc-recovery" checked={mode === "production"} disabled={!canReopenProduction || !access.canWrite} onChange={() => setMode("production")} />
            <span><b>Reopen production TNA</b><br />Repeat the failed item's production stages, then inspect again.
              {!canReopenProduction && <span className="block text-muted-foreground">No linked production TNA.</span>}
              {canReopenProduction && !access.canWrite && <span className="block text-muted-foreground">Production write access required.</span>}</span></label>
        </fieldset>}
        {!created && <details className="mt-4 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Corrective action details (optional)</summary>
          <div className="mt-3 space-y-3">
            <label className="block text-sm">Assigned to<input disabled={busy} maxLength={120} className="mt-1 w-full rounded-md border bg-background p-2" value={details.assignedTo} onChange={(e) => setDetails({ ...details, assignedTo: e.target.value })} /></label>
            <label className="block text-sm">Due date<input disabled={busy} type="date" className="mt-1 w-full rounded-md border bg-background p-2" value={details.dueDate} onChange={(e) => setDetails({ ...details, dueDate: e.target.value })} /></label>
            <label className="block text-sm">Notes<textarea disabled={busy} maxLength={400} className="mt-1 w-full rounded-md border bg-background p-2" value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} /></label>
          </div>
        </details>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={close}>{created ? "Close" : "Later"}</Button>
          {!created && <Button disabled={busy} onClick={save}>{busy ? "Saving..." : "Reopen"}</Button>}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
