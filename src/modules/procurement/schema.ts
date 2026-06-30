import { z } from "zod";

export const purchaseOrderSchema = z.object({
  supplier: z.string().min(1, "Required"),
  items: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  total: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
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
