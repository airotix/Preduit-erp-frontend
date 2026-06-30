import { z } from "zod";

export const orderSchema = z.object({
  customer: z.string().min(1, "Required"),
  channel: z.enum(["Wholesale", "Online", "Marketplace", "Retail"]),
  items: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  total: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
});

export const invoiceSchema = z.object({
  customer: z.string().min(1, "Required"),
  amount: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  dueDate: z.string().min(1, "Required"),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  type: z.enum(["Wholesale", "Retail"]),
  region: z.string().min(1, "Required"),
});

export const returnSchema = z.object({
  order: z.string().min(1, "Required"),
  customer: z.string().min(1, "Required"),
  reason: z.enum(["Size too small", "Defective seam", "Changed mind", "Wrong item"]),
  refund: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
});

export const SCHEMAS = {
  "orders": orderSchema,
  "invoices": invoiceSchema,
  "customers": customerSchema,
  "returns": returnSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
