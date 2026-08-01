import { z } from "zod";

// The New PO form is a bespoke multi-line editor (see po-form.tsx); this schema
// is kept only so the module still registers a "pos" create form.
export const purchaseOrderSchema = z.object({
  supplier: z.string().min(1, "Required"),
  expected: z.string().min(1, "Required"),
});

export const goodsReceiptSchema = z.object({
  po: z.string().min(1, "Required"),
  supplier: z.string().min(1, "Required"),
  lines: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Required"),
  region: z.string().min(1, "Required"),
  leadTime: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
});

export const SCHEMAS = {
  "pos": purchaseOrderSchema,
  "receipts": goodsReceiptSchema,
  "suppliers": supplierSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
