"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { fieldFormatError } from "@/lib/validators";

type Field = {
  name: string;
  label: string;
  kind: "text" | "number" | "enum" | "boolean" | "date" | "image";
  options?: string[];
  optional?: boolean;
};

/** Upload/preview control that stores the chosen image as a data URL. */
export function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pick = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 text-center text-[10px] text-muted-foreground">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : "No image"}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted">
          {value ? "Replace image" : "Upload image"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")}
                  className="text-left text-[12px] font-semibold text-muted-foreground hover:text-[#C0392B]">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function titleCase(s: string) {
  return s
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/** Introspect a ZodObject into a renderable field list. `dynamicOptions`
 *  lets a caller turn a plain string field into a select populated from
 *  live data (e.g. a category list fetched at render time) instead of a
 *  hardcoded enum baked into the schema — the schema itself only validates
 *  "non-empty", the live list is what actually constrains the choice. */
function fieldsFromSchema(
  schema: z.ZodObject<z.ZodRawShape>,
  dynamicOptions?: Record<string, string[]>
): Field[] {
  const shape = schema.shape;
  return Object.entries(shape).map(([name, raw]) => {
    let def = raw as z.ZodTypeAny;
    let optional = false;
    while (
      def instanceof z.ZodOptional ||
      def instanceof z.ZodNullable ||
      def instanceof z.ZodDefault
    ) {
      optional = optional || def instanceof z.ZodOptional;
      def = def._def.innerType;
    }
    let kind: Field["kind"] = "text";
    let options: string[] | undefined;
    if (def instanceof z.ZodNumber) kind = "number";
    else if (def instanceof z.ZodBoolean) kind = "boolean";
    else if (def instanceof z.ZodEnum) {
      kind = "enum";
      options = def._def.values as string[];
    }
    if (dynamicOptions?.[name]) {
      kind = "enum";
      options = dynamicOptions[name];
    }
    // Date-picker for due-date fields (stored/sent as an ISO date string).
    if (kind === "text" && /due.?date$/i.test(name)) kind = "date";
    // Image upload for image fields (stored/sent as a data URL or URL string).
    if (kind === "text" && /image/i.test(name)) kind = "image";
    return { name, label: titleCase(name), kind, options, optional };
  });
}

interface AutoFormProps<T extends z.ZodObject<z.ZodRawShape>> {
  schema: T;
  submitLabel?: string;
  onSubmit?: (values: z.infer<T>) => void;
  pending?: boolean;
  /** Prefill values (edit mode). */
  defaultValues?: Record<string, unknown>;
  /** Override a field's select options with live data (e.g. a category
   *  list fetched at render time) instead of whatever the schema declares. */
  dynamicOptions?: Record<string, string[]>;
}

export function AutoForm<T extends z.ZodObject<z.ZodRawShape>>({
  schema,
  submitLabel = "Create",
  onSubmit,
  pending,
  defaultValues,
  dynamicOptions,
}: AutoFormProps<T>) {
  const fields = React.useMemo(
    () => fieldsFromSchema(schema, dynamicOptions),
    [schema, dynamicOptions]
  );
  // Layer format checks (email/phone/website/…) on top of the module schema by
  // field name, so every AutoForm-driven form validates consistently.
  const guardedSchema = React.useMemo(
    () =>
      schema.superRefine((val: Record<string, unknown>, ctx) => {
        for (const [k, v] of Object.entries(val)) {
          const msg = fieldFormatError(k, v);
          if (msg) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [k], message: msg });
        }
      }),
    [schema]
  );
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(guardedSchema),
    mode: "onBlur",
    defaultValues: defaultValues as Record<string, unknown> | undefined,
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit?.(v as z.infer<T>))}
      className="flex flex-1 flex-col overflow-hidden"
    >
      <div className="erp-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-6">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={f.name}>
              {f.label}
              {!f.optional && <span className="ml-0.5 text-brand-orange">*</span>}
            </Label>

            {f.kind === "boolean" ? (
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  id={f.name}
                  checked={!!watch(f.name)}
                  onCheckedChange={(c) => setValue(f.name, c)}
                />
                <span className="text-sm text-muted-foreground">
                  {watch(f.name) ? "Enabled" : "Disabled"}
                </span>
              </div>
            ) : f.kind === "enum" ? (
              <Select
                value={(watch(f.name) as string) ?? ""}
                onValueChange={(val) => setValue(f.name, val)}
              >
                <SelectTrigger id={f.name}>
                  <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {f.options?.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : f.kind === "image" ? (
              <ImageField
                value={(watch(f.name) as string) || ""}
                onChange={(v) => setValue(f.name, v)}
              />
            ) : f.kind === "date" ? (
              <Input id={f.name} type="date" {...register(f.name)} />
            ) : (
              <Input
                id={f.name}
                type={f.kind === "number" ? "number" : "text"}
                step={f.kind === "number" ? "any" : undefined}
                {...register(
                  f.name,
                  f.kind === "number"
                    ? { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) }
                    : {}
                )}
              />
            )}

            {errors[f.name] && (
              <p className="text-xs font-semibold text-destructive">
                {String(errors[f.name]?.message ?? "Required")}
              </p>
            )}
          </div>
        ))}
      </div>

      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
