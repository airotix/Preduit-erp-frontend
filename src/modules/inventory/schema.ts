import { z } from "zod";

export const stockItemSchema = z.object({
  sku: z.string().min(1, "Required"),
  location: z.enum(["Lahore DC", "Karachi DC", "Dubai DC", "Flagship Store"]),
  onHand: z.number({ invalid_type_error: "Must be a number" }),
  reserved: z.number({ invalid_type_error: "Must be a number" }),
});

export const locationSchema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().min(1, "Required"),
  type: z.enum(["Warehouse", "Retail"]),
  region: z.string().min(1, "Required"),
});

export const transferSchema = z.object({
  from: z.enum(["Lahore DC", "Karachi DC", "Dubai DC", "Flagship Store"]),
  to: z.enum(["Lahore DC", "Karachi DC", "Dubai DC", "Flagship Store"]),
  units: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
});

export const reorderAlertSchema = z.object({
  sku: z.string().min(1, "Required"),
  suggested: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
  supplier: z.string().min(1, "Required"),
});

export const SCHEMAS = {
  "stock": stockItemSchema,
  "locations": locationSchema,
  "transfers": transferSchema,
  "alerts": reorderAlertSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
