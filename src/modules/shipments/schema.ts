import { z } from "zod";

export const shipmentSchema = z.object({
  order: z.string().min(1, "Required"),
  carrier: z.string().min(1, "Required"),
  destination: z.string().min(1, "Required"),
});

export const carrierSchema = z.object({
  name: z.string().min(1, "Required"),
  service: z.string().min(1, "Required"),
  avgTransit: z.string().min(1, "Required"),
});

export const SCHEMAS = {
  "shipments": shipmentSchema,
  "carriers": carrierSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
