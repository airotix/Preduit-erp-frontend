import { z } from "zod";

export const productionOrderSchema = z.object({
  style: z.string().min(1, "Required"),
  factory: z.string().min(1, "Required"),
  qty: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
});

export const bomLineSchema = z.object({
  component: z.string().min(1, "Required"),
  style: z.string().min(1, "Required"),
  material: z.string().min(1, "Required"),
  cost: z.number({ invalid_type_error: "Must be a number" }).positive("Must be greater than 0"),
});

export const SCHEMAS = {
  "porders": productionOrderSchema,
  "bom": bomLineSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
