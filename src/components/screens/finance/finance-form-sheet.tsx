"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export interface FinanceField {
  name: string;
  label: string;
  type?: "text" | "number" | "date";
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

/** Small generic create form used by the finance action buttons. */
export function FinanceFormSheet({
  open,
  onOpenChange,
  title,
  description,
  fields,
  submitLabel,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  fields: FinanceField[];
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: Record<string, string | number>) => void;
}) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setValues(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = () => {
    for (const f of fields) {
      if (f.required && !String(values[f.name] ?? "").trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    const out: Record<string, string | number> = {};
    for (const f of fields) {
      const raw = values[f.name] ?? "";
      out[f.name] = f.type === "number" ? Number(raw) || 0 : raw;
    }
    setError(null);
    onSubmit(out);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="erp-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-6">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>
                {f.label}
                {f.required && <span className="ml-0.5 text-brand-orange">*</span>}
              </Label>
              <Input
                id={f.name}
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                step={f.type === "number" ? "any" : undefined}
                placeholder={f.placeholder}
                value={values[f.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            </div>
          ))}
          {error && (
            <div className="rounded-md bg-[#FBEAEA] p-3 text-sm font-semibold text-[#C0392B]">{error}</div>
          )}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
