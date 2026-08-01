"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet";
import { apiPost } from "@/lib/api-client";

export const STAGE_NAMES = ["Trims", "Lining", "Cutting", "Sewing", "Finishing", "Packed"];
const DEFAULT_DAYS: Record<string, number> = {
  Trims: 2, Lining: 2, Cutting: 3, Sewing: 10, Finishing: 3, Packed: 1,
};

/** Start-production modal: set the number of days for each stage, then kick it off. */
export function ProductionStartModal({
  open,
  onOpenChange,
  orderId,
  stageNames,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orderId: string;
  stageNames?: string[];
  onStarted: () => void;
}) {
  const names = stageNames && stageNames.length ? stageNames : STAGE_NAMES;
  const [days, setDays] = React.useState<Record<string, number>>({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDays(Object.fromEntries(names.map((n) => [n, DEFAULT_DAYS[n] ?? 1])));
      setSaving(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/production/porders/${orderId}/start`, {
        stages: names.map((n) => ({ name: n, days: Math.max(0, Math.floor(Number(days[n]) || 0)) })),
      });
      onStarted();
    } catch {
      setError("Could not start production. Please try again.");
      setSaving(false);
    }
  };

  const total = names.reduce((s, n) => s + (Number(days[n]) || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Start production</SheetTitle>
          <SheetDescription>Set the planned duration (in days) for each stage.</SheetDescription>
        </SheetHeader>
        <div className="erp-scroll flex-1 space-y-3 overflow-y-auto px-6 pb-6">
          {names.map((n, i) => (
            <div key={n} className="flex items-center justify-between gap-3">
              <Label htmlFor={`stage-${n}`} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                {n}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`stage-${n}`}
                  type="number"
                  min={0}
                  className="w-24 text-right"
                  value={days[n] ?? 0}
                  onChange={(e) => setDays((d) => ({ ...d, [n]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                />
                <span className="text-[12px] text-muted-foreground">days</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-[13px]">
            <span className="font-semibold text-muted-foreground">Total lead time</span>
            <span className="font-extrabold text-foreground">{total} days</span>
          </div>
          {error && <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>}
        </div>
        <SheetFooter>
          <SheetClose asChild><Button type="button" variant="outline">Cancel</Button></SheetClose>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? "Starting…" : "Start production"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
