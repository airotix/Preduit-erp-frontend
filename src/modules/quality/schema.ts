import { z } from "zod";

export const inspectionSchema = z.object({
  order: z.string().min(1, "Required"),
  stage: z.enum(["Pre-Production", "Inline", "During Production", "Final", "Pre-Shipment"]),
  inspectionType: z.enum(["First Article", "In-line", "Final QC", "Pre-Shipment"]).optional(),
  aql: z.enum(["1.0", "1.5", "2.5", "4.0", "6.5"]),
  batchLot: z.string().optional(),
  inspector: z.string().optional(),
});

export const defectTypeSchema = z.object({
  name: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  severity: z.enum(["Critical", "Major", "Minor"]),
});

export const SCHEMAS = {
  "inspections": inspectionSchema,
  "defects": defectTypeSchema,
} as const;

export function getSchema(tab: string): z.ZodObject<z.ZodRawShape> | undefined {
  return (SCHEMAS as Record<string, z.ZodObject<z.ZodRawShape>>)[tab];
}
